import pdfMake from "pdfmake/build/pdfmake";
import pdfFonts from "pdfmake/build/vfs_fonts";
import logoVideplast from '../assets/videplast-brand.png'; 

if (pdfFonts && pdfFonts.pdfMake && pdfFonts.pdfMake.vfs) {
    pdfMake.vfs = pdfFonts.pdfMake.vfs;
} else if (pdfFonts && pdfFonts.vfs) {
    pdfMake.vfs = pdfFonts.vfs;
} else {
    try { pdfMake.vfs = pdfFonts; } catch (e) { console.error(e); }
}

const getBase64ImageFromURL = (url) => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.setAttribute("crossOrigin", "anonymous");
    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext("2d");
      ctx.drawImage(img, 0, 0);
      resolve(canvas.toDataURL("image/png"));
    };
    img.onerror = () => resolve(null);
    img.src = url;
  });
};

export const geradorPDF = async (data, centro_custo, centro_custo_nome) => {
  let logoBase64 = await getBase64ImageFromURL(logoVideplast);
  
  const contentBody = [];

  const tableBody = [
      [
          { text: 'IMOBILIZADO', style: 'tableHeader' },
          { text: 'SUBNº', style: 'tableHeader' },
          { text: 'INVENTÁRIO', style: 'tableHeader' },
          { text: 'DESCRIÇÃO', style: 'tableHeader' },
          { text: 'LOCAL', style: 'tableHeader' }
      ]
  ];

  data.forEach((item, index) => {
      tableBody.push([
          { text: item.codigo_imobilizado || '-', style: 'cell' },
          { text: item.sub_numero || '0', style: 'cell' },
          { text: item.codigo_inventario || '-', style: 'cell' },
          { text: item.descricao || '', style: 'cell' },
          { text: item.local || '', style: 'cell' }
      ]);
  });

  const docDefinition = {
      pageSize: 'A4',
      pageMargins: [20, 100, 20, 40],
      header: {
          margin: [20, 20, 20, 0],
          columns: [
              logoBase64 ? { image: logoBase64, width: 100 } : { text: 'VIDEPLAST', bold: true },
              { text: `Relatório CC: ${centro_custo}`, alignment: 'right', bold: true }
          ]
      },
      content: [
          {
              table: {
                  headerRows: 1,
                  widths: ['auto', 'auto', 'auto', '*', 'auto'],
                  body: tableBody
              },
              layout: 'lightHorizontalLines'
          }
      ],
      styles: {
          tableHeader: { bold: true, fontSize: 10, fillColor: '#eeeeee' },
          cell: { fontSize: 9 }
      }
  };

  pdfMake.createPdf(docDefinition).download(`Relatorio_CC_${centro_custo}.pdf`);
};