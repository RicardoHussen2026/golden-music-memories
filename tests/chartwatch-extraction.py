"""Focused tests for PDF rows which previously produced wrong credits/order."""
import importlib.util
import unittest
from pathlib import Path

spec = importlib.util.spec_from_file_location("chartwatch", Path(__file__).resolve().parents[1] / "scripts/rankings-chartwatch.py")
chartwatch = importlib.util.module_from_spec(spec)
spec.loader.exec_module(chartwatch)


class Extraction(unittest.TestCase):
    def test_official_position_not_author_points(self):
        row = chartwatch.parse_row("1 22 3 Bob The Builder Can We Fix It (cid:21) Bob The Builder (BBC Worldwide) 1 4 4 853 189 254.28")
        self.assertEqual((row["official"], row["cw"], row["pos"]), (1, 22, 3))

    def test_artist_cid_is_not_label(self):
        row = chartwatch.parse_row("5 4 5 Hey Baby [UK + D imp] (cid:21) DJ (cid:214)tzi (EMI) 1 21 23 747,170 378 293.95")
        self.assertEqual(row["artist"], "DJ Ötzi")
        self.assertEqual(row["title"], "Hey Baby [UK + D imp]")

    def test_internal_title_separator(self):
        row = chartwatch.parse_row("3 2 5 Ignition (cid:21) Remix (cid:21) R. Kelly (Jive) 1 20 26 478,400 432 180.96")
        self.assertEqual((row["title"], row["artist"]), ("Ignition – Remix", "R. Kelly"))

    def test_label_ligature_and_featured_credit(self):
        row = chartwatch.parse_row("20 15 14 The Bad Touch (cid:21) Bloodhound Gang (Republic/Ge(cid:27)en) 4 14 19 377 210 182.62")
        self.assertEqual(row["artist"], "Bloodhound Gang")
        self.assertEqual(chartwatch.normalize_credit("Daniel Beding(cid:28)eld"), "Daniel Bedingfield")

    def test_unknown_font_mapping_fails_closed(self):
        with self.assertRaises(ValueError):
            chartwatch.normalize_credit("Artist (cid:999)")

    def test_incomplete_row_does_not_silently_drop(self):
        with self.assertRaises(ValueError):
            chartwatch.parse_row("1 2 3 Missing artist separator (Label) 1 2 3")

    def test_five_real_tables_deterministic_and_complete(self):
        for year, page in chartwatch.PAGES.items():
            with self.subTest(year=year):
                path = Path(".cache/chartwatch") / f"CLUK{year}.pdf"
                if not path.exists():
                    self.skipTest("PDF evidence cache unavailable; acquire named publisher file before integration check")
                first = chartwatch.extract_list(path, year, "2026-10-25T00:00:00Z")
                second = chartwatch.extract_list(path, year, "2026-10-25T00:00:00Z")
                self.assertEqual(first, second)
                self.assertEqual([r["position"] for r in first["rows"]], list(range(1, 31)))
                self.assertEqual(first["sourcePage"], page)
                self.assertTrue(all(r["releaseYear"] is None for r in first["rows"]))


if __name__ == "__main__":
    unittest.main()
