import swaggerJSDoc from "swagger-jsdoc";
import swaggerUi from "swagger-ui-express";
import { Express } from "express";

const PORT = process.env.PORT ?? 3000;
const options: swaggerJSDoc.Options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "Pokemon API",
      version: "1.0.0",
      description: "API documentation for the Pokemon service",
    },
    servers: [
      {
        url: `http://localhost:${PORT}`, 
      },
    ],
  },
  apis: ["./src/routes/*.ts"],
};


const swaggerSpec = swaggerJSDoc(options);


export const setupSwagger = (app: Express) => {
  app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));
  console.log("✅ Swagger docs available at http://localhost:3000/api-docs");
};
