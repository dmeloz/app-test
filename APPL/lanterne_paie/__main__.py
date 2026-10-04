"""Lancement : python -m lanterne_paie"""

import os
import sys

from PySide6.QtCore import QTimer
from PySide6.QtWidgets import QApplication

from .ui.fenetre import Fenetre


def main() -> int:
    app = QApplication(sys.argv)
    app.setApplicationName("Lanterne Paie")
    fenetre = Fenetre()
    fenetre.show()
    if os.environ.get("LANTERNE_TEST_DEMARRAGE") == "1":
        # Contrôle automatique (serveur de test) : la fenêtre s'ouvre puis l'application se ferme.
        QTimer.singleShot(1500, app.quit)
    return app.exec()


if __name__ == "__main__":
    sys.exit(main())
