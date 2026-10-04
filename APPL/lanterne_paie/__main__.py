"""Lancement : python -m lanterne_paie"""

import sys

from PySide6.QtWidgets import QApplication

from .ui.fenetre import Fenetre


def main() -> int:
    app = QApplication(sys.argv)
    app.setApplicationName("Lanterne Paie")
    fenetre = Fenetre()
    fenetre.show()
    return app.exec()


if __name__ == "__main__":
    sys.exit(main())
