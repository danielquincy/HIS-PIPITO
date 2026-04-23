package org.lospipitos.his.reporting;

import com.lowagie.text.Document;
import com.lowagie.text.Paragraph;
import com.lowagie.text.pdf.PdfPTable;
import com.lowagie.text.pdf.PdfWriter;
import org.apache.poi.ss.usermodel.Row;
import org.apache.poi.xssf.usermodel.XSSFSheet;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.lospipitos.his.scheduling.CitaFinancieroRepository;
import org.lospipitos.his.scheduling.CitaRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.Instant;

@Service
public class ReportService {

    private final CitaRepository citaRepository;
    private final CitaFinancieroRepository citaFinancieroRepository;

    public ReportService(CitaRepository citaRepository, CitaFinancieroRepository citaFinancieroRepository) {
        this.citaRepository = citaRepository;
        this.citaFinancieroRepository = citaFinancieroRepository;
    }

    @Transactional(readOnly = true)
    public ResumenDto resumen(Instant desde, Instant hasta) {
        long citas = citaRepository.countEntre(desde, hasta);
        long inasistencias = citaRepository.countByEstadoEntre("NO_ASISTIO", desde, hasta);
        BigDecimal ingresos = citaFinancieroRepository.sumIngresosEntre(desde, hasta);
        BigDecimal costos = citaFinancieroRepository.sumCostosEntre(desde, hasta);
        BigDecimal balance = ingresos.subtract(costos);
        BigDecimal promedioIngresoPorCita = citas > 0
                ? ingresos.divide(BigDecimal.valueOf(citas), 2, RoundingMode.HALF_UP)
                : BigDecimal.ZERO;
        return new ResumenDto(desde, hasta, citas, inasistencias, ingresos, costos, balance, promedioIngresoPorCita);
    }

    public byte[] buildPdfResumen(ResumenDto r) throws Exception {
        ByteArrayOutputStream baos = new ByteArrayOutputStream();
        Document doc = new Document();
        PdfWriter.getInstance(doc, baos);
        doc.open();
        doc.add(new Paragraph("HIS-PIPITOS — Resumen de citas y finanzas"));
        doc.add(new Paragraph("Periodo: " + r.desde() + " — " + r.hasta()));
        doc.add(new Paragraph(" "));
        PdfPTable table = new PdfPTable(2);
        table.addCell("Citas en periodo");
        table.addCell(String.valueOf(r.citas()));
        table.addCell("Inasistencias (NO_ASISTIO)");
        table.addCell(String.valueOf(r.inasistencias()));
        table.addCell("Ingresos");
        table.addCell(r.ingresos().toPlainString());
        table.addCell("Costos");
        table.addCell(r.costos().toPlainString());
        table.addCell("Balance");
        table.addCell(r.balance().toPlainString());
        table.addCell("Promedio ingreso / cita");
        table.addCell(r.promedioIngresoPorCita().toPlainString());
        doc.add(table);
        doc.close();
        return baos.toByteArray();
    }

    public byte[] buildExcelResumen(ResumenDto r) throws IOException {
        try (XSSFWorkbook wb = new XSSFWorkbook(); ByteArrayOutputStream baos = new ByteArrayOutputStream()) {
            XSSFSheet sh = wb.createSheet("Resumen");
            int row = 0;
            Row h0 = sh.createRow(row++);
            h0.createCell(0).setCellValue("HIS-PIPITOS Resumen");
            Row h1 = sh.createRow(row++);
            h1.createCell(0).setCellValue("Desde");
            h1.createCell(1).setCellValue(r.desde().toString());
            Row h2 = sh.createRow(row++);
            h2.createCell(0).setCellValue("Hasta");
            h2.createCell(1).setCellValue(r.hasta().toString());
            row++;
            String[][] data = {
                    {"Citas", String.valueOf(r.citas())},
                    {"Inasistencias", String.valueOf(r.inasistencias())},
                    {"Ingresos", r.ingresos().toPlainString()},
                    {"Costos", r.costos().toPlainString()},
                    {"Balance", r.balance().toPlainString()},
                    {"Promedio ingreso/cita", r.promedioIngresoPorCita().toPlainString()}
            };
            for (String[] d : data) {
                Row rr = sh.createRow(row++);
                rr.createCell(0).setCellValue(d[0]);
                rr.createCell(1).setCellValue(d[1]);
            }
            wb.write(baos);
            return baos.toByteArray();
        }
    }

    public record ResumenDto(
            Instant desde,
            Instant hasta,
            long citas,
            long inasistencias,
            BigDecimal ingresos,
            BigDecimal costos,
            BigDecimal balance,
            BigDecimal promedioIngresoPorCita
    ) {}
}
