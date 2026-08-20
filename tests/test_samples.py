"""Cross-language correctness check for the Python code samples.

Every algorithm ships a hand-written Python implementation next to its
TypeScript engine, shown on the site as "the real, working code that performs
each step". A sample that quietly disagrees with the engine would be worse than
no sample at all — someone learning from it would carry the error away with
them.

So both languages are held to the same fixture. `src/algorithms/<id>/vectors.json`
is generated from the engine (`node scripts/gen-vectors.mjs`) and pinned; the
TypeScript engine tests assert against it, and so does this file. If a Python
sample drifts, or an engine changes without the samples following, this fails.

Run:  python3 -m unittest discover -s tests
"""

import importlib.util
import json
import pathlib
import sys
import unittest

ROOT = pathlib.Path(__file__).resolve().parent.parent
ALGORITHMS = ROOT / "src" / "algorithms"

# Samples may import each other the way the engines do — Triple DES composes
# three DES operations rather than carrying a second copy of the cipher — so
# every sample directory has to be importable.
for _code_dir in sorted(ALGORITHMS.glob("*/code")):
    sys.path.insert(0, str(_code_dir))


def sample_path(algorithm: str) -> pathlib.Path:
    """The single Python sample in an algorithm's `code/` directory.

    Discovered rather than named after the folder: the HMAC sample cannot be
    called `hmac.py` without shadowing the standard library for everything
    imported after it.
    """
    found = sorted((ALGORITHMS / algorithm / "code").glob("*.py"))
    assert len(found) == 1, f"{algorithm}: expected exactly one sample, found {found}"
    return found[0]


def load_sample(algorithm: str):
    path = sample_path(algorithm)
    spec = importlib.util.spec_from_file_location(f"cryptolab_{algorithm}", path)
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


def discover():
    for vectors in sorted(ALGORITHMS.glob("*/vectors.json")):
        yield vectors.parent.name, json.loads(vectors.read_text())


class PythonSamplesMatchVectors(unittest.TestCase):
    def test_every_algorithm_has_a_sample_and_vectors(self):
        found = {name for name, _ in discover()}
        expected = {
            path.parent.parent.name for path in ALGORITHMS.glob("*/code/*.py")
        }
        self.assertEqual(
            found,
            expected,
            "every algorithm with a Python sample needs vectors, and vice versa",
        )

    def test_samples_reproduce_the_vectors(self):
        checked = 0
        for algorithm, data in discover():
            module = load_sample(algorithm)
            for case in data["cases"]:
                with self.subTest(algorithm=algorithm, case=case["name"]):
                    actual = module.run(
                        case["input"], case["params"], case["direction"]
                    )
                    self.assertEqual(
                        actual,
                        case["output"],
                        f"{algorithm} / {case['name']}: the Python sample disagrees "
                        f"with the engine. One of them is wrong.",
                    )
                    checked += 1
        # A harness that silently checks nothing is the classic way this kind of
        # test rots into decoration.
        self.assertGreater(checked, 25, "expected the full vector set to run")


if __name__ == "__main__":
    unittest.main()
