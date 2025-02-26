import { FastifyRequest, FastifyReply } from "fastify";
import OpenAI from "openai";
import "dotenv/config";

const openai = new OpenAI({
apiKey: process.env.OPENAI_API_KEY,
});

const generateAIResponse = async (req: FastifyRequest, res: FastifyReply) => {
try {
    const { jsonText, ask } = req.body as { jsonText: string; ask: string };

    if (!jsonText || !ask) {
    return res.status(400).send({ error: "jsonText and ask are required" });
    }

    const response = await openai.chat.completions.create({
    model: "gpt-3.5-turbo",
    messages: [
        {
        role: "system",
        content:
            "Eres un experto en análisis de datos JSON. Analiza la estructura del JSON y responde preguntas basadas en su contenido con precisión.",
        },
        {
        role: "user",
        content: `Aquí tienes un JSON para analizar. Usa esta información para responder preguntas con base en su contenido:\n\n\`\`\`json\n${jsonText}\n\`\`\``,
        },
        {
        role: "user",
        content: `Pregunta: ${ask}`,
        },
    ],
    });

    res.status(200).send({ response: response.choices[0].message.content });
} catch (error) {
    console.error("Error generating AI response:", error);
    res.status(500).send({ error: "Error generating AI response" });
}
};

export default generateAIResponse;


