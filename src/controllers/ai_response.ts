import { FastifyRequest, FastifyReply } from 'fastify';
import OpenAI from 'openai';
import 'dotenv/config';

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

const generateAIResponse = async (req: FastifyRequest, res: FastifyReply) => {
    try {

        const { prompt } = req.body as { prompt: string };

        const response = await openai.chat.completions.create({
            model: "gpt-3.5-turbo",
            messages: [{ role: "user", content: prompt }],
        });

        res.status(200).send({ response: response.choices[0].message.content });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).send({ error: "Error interno del servidor" });
    }
}

export default generateAIResponse;

