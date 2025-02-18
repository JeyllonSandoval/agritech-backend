import { FastifyRequest, FastifyReply } from "fastify";
import * as pdf from "pdf-parse";

export const parsePDF = async (req: FastifyRequest, reply: FastifyReply) => {
    try {

        const data = await req.file();
        if (!data) {
            return reply.status(400).send({ error: "No PDF file uploaded" });
        }


        const fileBuffer = await data.toBuffer();


        const pdfData = await pdf(fileBuffer);

        const jsonResponse = {
            text: pdfData.text,
            info: pdfData.info,
            metadata: pdfData.metadata,
        };

        return reply.status(200).send(jsonResponse);
    } catch (error) {
        console.error("Error parsing PDF:", error);
        return reply.status(500).send({ error: "Failed to process PDF" });
    }
};
