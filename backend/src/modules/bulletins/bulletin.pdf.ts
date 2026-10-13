import PDFDocument from "pdfkit";

// Données nécessaires au bulletin. La fonction de rendu ne connaît ni
// Express ni Prisma : elle reçoit des données déjà prêtes et produit un
// document. Ça la rend testable seule, et réutilisable (autre format de
// sortie, envoi par e-mail...) sans toucher au reste de l'application.
export interface BulletinData {
  student: { firstName: string; lastName: string; email: string };
  className: string | null;
  generatedAt: Date;
  subjects: {
    name: string;
    teacherName: string | null;
    grades: { value: number; maxValue: number }[];
    average: number | null; // moyenne sur 20
  }[];
  generalAverage: number | null; // moyenne générale sur 20
  absences: { total: number; unjustified: number };
}

const COLORS = {
  navy: "#0f172a",
  emerald: "#10b981",
  text: "#1e293b",
  muted: "#64748b",
  line: "#e2e8f0",
  rowAlt: "#f8fafc",
};

// Format "12/20" ou "7.5/10" sans décimale inutile.
const fmt = (n: number) => (Number.isInteger(n) ? String(n) : n.toFixed(1));

export function createBulletinPdf(data: BulletinData): InstanceType<typeof PDFDocument> {
  const doc = new PDFDocument({ size: "A4", margin: 50, info: { Title: "Bulletin de notes" } });
  const left = 50;
  const right = doc.page.width - 50;
  const contentWidth = right - left;

  // --- Bandeau d'en-tête -----------------------------------------------
  doc.rect(0, 0, doc.page.width, 90).fill(COLORS.navy);
  doc.fillColor("#ffffff").font("Helvetica-Bold").fontSize(22).text("NextCampus", left, 28);
  doc.font("Helvetica").fontSize(11).fillColor(COLORS.emerald).text("Bulletin de notes", left, 56);

  // --- Identité de l'étudiant ------------------------------------------
  doc.fillColor(COLORS.text).font("Helvetica-Bold").fontSize(16);
  doc.text(`${data.student.firstName} ${data.student.lastName}`, left, 115);
  doc.font("Helvetica").fontSize(10).fillColor(COLORS.muted);
  doc.text(`Classe : ${data.className ?? "Aucune classe affectée"}`, left, 138);
  doc.text(`Édité le ${data.generatedAt.toLocaleDateString("fr-FR")}`, left, 152);

  // --- Tableau des matières --------------------------------------------
  const cols = {
    subject: { x: left, w: 170 },
    teacher: { x: left + 170, w: 120 },
    grades: { x: left + 290, w: 135 },
    average: { x: left + 425, w: contentWidth - 425 },
  };

  let y = 190;

  const drawTableHeader = () => {
    doc.rect(left, y, contentWidth, 24).fill(COLORS.navy);
    doc.fillColor("#ffffff").font("Helvetica-Bold").fontSize(9);
    doc.text("MATIÈRE", cols.subject.x + 8, y + 8, { width: cols.subject.w });
    doc.text("ENSEIGNANT", cols.teacher.x + 8, y + 8, { width: cols.teacher.w });
    doc.text("NOTES", cols.grades.x + 8, y + 8, { width: cols.grades.w });
    doc.text("MOYENNE /20", cols.average.x, y + 8, { width: cols.average.w - 8, align: "right" });
    y += 24;
  };

  drawTableHeader();

  if (data.subjects.length === 0) {
    doc.fillColor(COLORS.muted).font("Helvetica-Oblique").fontSize(10);
    doc.text("Aucune matière dans cette classe pour le moment.", left + 8, y + 12);
    y += 40;
  }

  data.subjects.forEach((subject, index) => {
    const gradesText = subject.grades.length > 0
      ? subject.grades.map((g) => `${fmt(g.value)}/${fmt(g.maxValue)}`).join("  ·  ")
      : "—";

    doc.font("Helvetica").fontSize(10);
    const rowHeight = Math.max(
      28,
      doc.heightOfString(gradesText, { width: cols.grades.w - 8 }) + 16,
      doc.heightOfString(subject.name, { width: cols.subject.w - 8 }) + 16
    );

    // Saut de page si la ligne ne tient pas : on redessine l'en-tête
    if (y + rowHeight > doc.page.height - 120) {
      doc.addPage();
      y = 50;
      drawTableHeader();
    }

    if (index % 2 === 0) doc.rect(left, y, contentWidth, rowHeight).fill(COLORS.rowAlt);

    doc.fillColor(COLORS.text).font("Helvetica-Bold").fontSize(10);
    doc.text(subject.name, cols.subject.x + 8, y + 8, { width: cols.subject.w - 8 });
    doc.font("Helvetica").fillColor(COLORS.muted);
    doc.text(subject.teacherName ?? "—", cols.teacher.x + 8, y + 8, { width: cols.teacher.w - 8 });
    doc.fillColor(COLORS.text);
    doc.text(gradesText, cols.grades.x + 8, y + 8, { width: cols.grades.w - 8 });
    doc.font("Helvetica-Bold");
    doc.text(subject.average !== null ? subject.average.toFixed(1) : "—", cols.average.x, y + 8, {
      width: cols.average.w - 8,
      align: "right",
    });

    y += rowHeight;
    doc.moveTo(left, y).lineTo(right, y).strokeColor(COLORS.line).lineWidth(0.5).stroke();
  });

  // --- Synthèse : moyenne générale et absences ---------------------------
  y += 24;
  // Les deux encadrés de synthèse font 64 pt de haut ; on réserve en plus
  // la place du pied de page (70 pt) avant de décider d'un saut de page.
  if (y + 64 > doc.page.height - 70) {
    doc.addPage();
    y = 50;
  }

  const boxWidth = (contentWidth - 16) / 2;

  doc.roundedRect(left, y, boxWidth, 64, 6).fill(COLORS.rowAlt);
  doc.fillColor(COLORS.muted).font("Helvetica").fontSize(9).text("MOYENNE GÉNÉRALE", left + 14, y + 12);
  doc.fillColor(COLORS.text).font("Helvetica-Bold").fontSize(22);
  doc.text(data.generalAverage !== null ? `${data.generalAverage.toFixed(1)} / 20` : "—", left + 14, y + 30);

  const box2x = left + boxWidth + 16;
  doc.roundedRect(box2x, y, boxWidth, 64, 6).fill(COLORS.rowAlt);
  doc.fillColor(COLORS.muted).font("Helvetica").fontSize(9).text("ABSENCES", box2x + 14, y + 12);
  doc.fillColor(COLORS.text).font("Helvetica-Bold").fontSize(22).text(String(data.absences.total), box2x + 14, y + 30);
  doc.font("Helvetica").fontSize(10).fillColor(COLORS.muted);
  doc.text(`dont ${data.absences.unjustified} non justifiée(s)`, box2x + 14 + 40, y + 38);

  // --- Pied de page ------------------------------------------------------
  // Le pied de page est écrit dans la marge basse. Par défaut, pdfkit
  // ajoute alors une page vierge pour y "faire déborder" le texte : on
  // supprime donc la marge basse de la page courante avant d'écrire.
  doc.page.margins.bottom = 0;
  doc.font("Helvetica").fontSize(8).fillColor(COLORS.muted);
  doc.text(
    "Document généré automatiquement par la plateforme Smart Campus. Les moyennes sont calculées sur 20.",
    left,
    doc.page.height - 50,
    { width: contentWidth, align: "center" }
  );

  return doc;
}
