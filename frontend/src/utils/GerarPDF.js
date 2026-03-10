// ============================================================
//  gerarPDF.js — Relatório PDF da SafraTerra
//  Bibliotecas: jsPDF + jspdf-autotable
// ============================================================

import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

const fmt = (v) =>
  Number(v).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

const hoje = () =>
  new Date().toLocaleDateString("pt-BR", { day: "2-digit", month: "long", year: "numeric" });

export function gerarRelatorio({ dash, talhoes, safras, insumosPorSafra = {}, nomeUsuario = "" }) {
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  const W = doc.internal.pageSize.getWidth();
  let y = 0;

  // ── Cabeçalho verde ──────────────────────────────────────
  doc.setFillColor(30, 58, 30);
  doc.rect(0, 0, W, 38, "F");

  doc.setTextColor(123, 189, 142);
  doc.setFontSize(22);
  doc.setFont("helvetica", "bold");
  doc.text("SafraTerra", 14, 16);

  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(200, 230, 200);
  doc.text("Relatório de Gestão de Safras", 14, 24);
  doc.text(`Produtor: ${nomeUsuario}`, 14, 31);
  doc.text(`Gerado em: ${hoje()}`, W - 14, 31, { align: "right" });

  y = 48;

  // ── Resumo financeiro ────────────────────────────────────
  doc.setTextColor(30, 58, 30);
  doc.setFontSize(13);
  doc.setFont("helvetica", "bold");
  doc.text("Resumo Geral", 14, y);
  y += 6;

  autoTable(doc, {
    startY: y,
    head: [["Indicador", "Valor"]],
    body: [
      ["Talhões cadastrados", dash.total_talhoes],
      ["Área total", `${dash.total_area_ha} ha`],
      ["Safras registradas", dash.total_safras],
      ["Custo com insumos", fmt(dash.custo_insumos)],
      ["Receita estimada", fmt(dash.receita_estimada)],
      ["Lucro estimado", fmt(dash.lucro_estimado)],
      ["Margem", dash.receita_estimada > 0
        ? ((dash.lucro_estimado / dash.receita_estimada) * 100).toFixed(1) + "%"
        : "—"],
    ],
    styles: { fontSize: 10, cellPadding: 4 },
    headStyles: { fillColor: [30, 58, 30], textColor: [123, 189, 142], fontStyle: "bold" },
    alternateRowStyles: { fillColor: [240, 248, 240] },
    columnStyles: { 1: { halign: "right", fontStyle: "bold" } },
    margin: { left: 14, right: 14 },
  });

  y = doc.lastAutoTable.finalY + 12;

  // ── Talhões ──────────────────────────────────────────────
  doc.setTextColor(30, 58, 30);
  doc.setFontSize(13);
  doc.setFont("helvetica", "bold");
  doc.text("Talhões", 14, y);
  y += 6;

  autoTable(doc, {
    startY: y,
    head: [["Nome", "Área (ha)", "Solo", "Coordenadas"]],
    body: talhoes.map(t => [
      t.nome,
      t.area_ha,
      t.solo || "—",
      t.latitude ? `${t.latitude}, ${t.longitude}` : "—",
    ]),
    styles: { fontSize: 9, cellPadding: 3 },
    headStyles: { fillColor: [30, 58, 30], textColor: [123, 189, 142] },
    alternateRowStyles: { fillColor: [240, 248, 240] },
    margin: { left: 14, right: 14 },
  });

  y = doc.lastAutoTable.finalY + 12;

  // ── Safras ───────────────────────────────────────────────
  doc.setTextColor(30, 58, 30);
  doc.setFontSize(13);
  doc.setFont("helvetica", "bold");
  doc.text("Safras", 14, y);
  y += 6;

  autoTable(doc, {
    startY: y,
    head: [["Cultura", "Talhão", "Ciclo", "Status", "Produt. (sc/ha)", "Preço/sc", "Receita est."]],
    body: safras.map(s => {
      const receita = s.produtividade_sc_ha && s.preco_saca && s.area_ha
        ? fmt(s.produtividade_sc_ha * s.preco_saca * s.area_ha) : "—";
      return [
        s.cultura,
        s.talhao_nome,
        s.ciclo || "—",
        s.status,
        s.produtividade_sc_ha || "—",
        s.preco_saca ? fmt(s.preco_saca) : "—",
        receita,
      ];
    }),
    styles: { fontSize: 8, cellPadding: 3 },
    headStyles: { fillColor: [30, 58, 30], textColor: [123, 189, 142] },
    alternateRowStyles: { fillColor: [240, 248, 240] },
    margin: { left: 14, right: 14 },
  });

  // ── Insumos por safra ────────────────────────────────────
  for (const safra of safras) {
    const insumos = insumosPorSafra[safra.id];
    if (!insumos?.length) continue;

    doc.addPage();
    y = 20;

    doc.setFillColor(30, 58, 30);
    doc.rect(0, 0, W, 16, "F");
    doc.setTextColor(123, 189, 142);
    doc.setFontSize(11);
    doc.setFont("helvetica", "bold");
    doc.text(`Insumos — ${safra.cultura} (${safra.talhao_nome})`, 14, 11);

    autoTable(doc, {
      startY: y,
      head: [["Descrição", "Qtd", "Unidade", "Data Aplicação", "Custo"]],
      body: insumos.map(i => [
        i.descricao,
        i.quantidade || "—",
        i.unidade || "—",
        i.data_aplicacao || "—",
        fmt(i.custo_total),
      ]),
      foot: [[
        { content: "Total", colSpan: 4, styles: { halign: "right", fontStyle: "bold" } },
        { content: fmt(insumos.reduce((s, i) => s + i.custo_total, 0)), styles: { fontStyle: "bold" } },
      ]],
      styles: { fontSize: 9, cellPadding: 3 },
      headStyles: { fillColor: [30, 58, 30], textColor: [123, 189, 142] },
      footStyles: { fillColor: [240, 248, 240], textColor: [30, 80, 30] },
      alternateRowStyles: { fillColor: [245, 252, 245] },
      margin: { left: 14, right: 14 },
    });
  }

  // ── Rodapé em todas as páginas ───────────────────────────
  const totalPaginas = doc.getNumberOfPages();
  for (let i = 1; i <= totalPaginas; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(180, 180, 180);
    doc.text(`SafraTerra © ${new Date().getFullYear()} — Página ${i} de ${totalPaginas}`, W / 2, 290, { align: "center" });
  }

  // ── Salvar ───────────────────────────────────────────────
  const nomeArquivo = `SafraTerra_Relatorio_${new Date().toISOString().slice(0, 10)}.pdf`;
  doc.save(nomeArquivo);
}