import { FastifyRequest, FastifyReply } from 'fastify';
import OpenAI from 'openai';

const openai = new OpenAI({
    apiKey: process.env.OPEN_AI_API_KEY,
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
        res.status(500).send({ error: "Error generating AI response" });
    }
}

export default generateAIResponse;

