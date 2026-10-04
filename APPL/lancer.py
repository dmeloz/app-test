"""Point d'entrée pour l'application empaquetée (PyInstaller)."""

import sys

from lanterne_paie.__main__ import main

if __name__ == "__main__":
    sys.exit(main())
