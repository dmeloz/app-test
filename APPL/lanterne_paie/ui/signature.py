"""Zone de dessin de la signature (enregistrée en PNG transparent)."""

from __future__ import annotations

from pathlib import Path

from PySide6.QtCore import QPoint, Qt
from PySide6.QtGui import QColor, QImage, QPainter, QPen
from PySide6.QtWidgets import QDialog, QDialogButtonBox, QLabel, QPushButton, QVBoxLayout, QWidget


class Toile(QWidget):
    def __init__(self) -> None:
        super().__init__()
        self.setFixedSize(480, 180)
        self.image = QImage(self.size(), QImage.Format_ARGB32)
        self.image.fill(Qt.transparent)
        self.dernier: QPoint | None = None
        self.vide = True

    def effacer(self) -> None:
        self.image.fill(Qt.transparent)
        self.vide = True
        self.update()

    def mousePressEvent(self, e) -> None:  # noqa: N802 (API Qt)
        self.dernier = e.position().toPoint()

    def mouseMoveEvent(self, e) -> None:  # noqa: N802
        if self.dernier is None:
            return
        p = QPainter(self.image)
        p.setRenderHint(QPainter.Antialiasing)
        p.setPen(QPen(QColor(20, 30, 110), 3, Qt.SolidLine, Qt.RoundCap, Qt.RoundJoin))
        point = e.position().toPoint()
        p.drawLine(self.dernier, point)
        p.end()
        self.dernier = point
        self.vide = False
        self.update()

    def mouseReleaseEvent(self, e) -> None:  # noqa: N802
        self.dernier = None

    def paintEvent(self, e) -> None:  # noqa: N802
        p = QPainter(self)
        p.fillRect(self.rect(), Qt.white)
        p.setPen(QPen(QColor(200, 200, 200), 1, Qt.DashLine))
        p.drawLine(20, self.height() - 40, self.width() - 20, self.height() - 40)
        p.drawImage(0, 0, self.image)
        p.end()


class DialogueSignature(QDialog):
    def __init__(self, parent=None) -> None:
        super().__init__(parent)
        self.setWindowTitle("Dessiner la signature")
        self.toile = Toile()
        effacer = QPushButton("Effacer")
        effacer.clicked.connect(self.toile.effacer)
        boutons = QDialogButtonBox(QDialogButtonBox.Save | QDialogButtonBox.Cancel)
        boutons.button(QDialogButtonBox.Save).setText("Enregistrer")
        boutons.button(QDialogButtonBox.Cancel).setText("Annuler")
        boutons.accepted.connect(self.accept)
        boutons.rejected.connect(self.reject)
        mise = QVBoxLayout(self)
        mise.addWidget(QLabel("Signez dans le cadre avec la souris ou le trackpad."))
        mise.addWidget(self.toile)
        mise.addWidget(effacer)
        mise.addWidget(boutons)

    def enregistrer(self, chemin: Path) -> bool:
        if self.toile.vide:
            return False
        return self.toile.image.save(str(chemin), "PNG")
