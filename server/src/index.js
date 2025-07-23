const express = require("express");
const cors = require("cors");
const AWS = require("aws-sdk");
require("dotenv").config();

const { metricsMiddleware, startMetricsCollection } = require("./middleware/metrics");

const app = express();
const PORT = process.env.PORT || 5001;

// Configuration AWS DynamoDB
const dynamoConfig = {
	region: process.env.AWS_REGION || "eu-west-1",
};

// En développement, utiliser DynamoDB Local
if (process.env.NODE_ENV === "development") {
	dynamoConfig.endpoint = process.env.DYNAMODB_ENDPOINT || "http://localhost:8000";
	dynamoConfig.accessKeyId = "dummy";
	dynamoConfig.secretAccessKey = "dummy";
}

const dynamodb = new AWS.DynamoDB.DocumentClient(dynamoConfig);
const TABLE_NAME = process.env.DYNAMODB_TABLE_NAME || "todos-local";

// Middleware
app.use(cors());
app.use(express.json());

app.use(metricsMiddleware);

app.use((req, res, next) => {
	const timestamp = new Date().toISOString();
	console.log(`[${timestamp}] ${req.method} ${req.path} - IP: ${req.ip}`);
	next();
});

// Health check
app.get("/health", (req, res) => {
	res.json({ 
		status: "OK", 
		timestamp: new Date().toISOString(),
		version: "1.0.0",
		environment: process.env.NODE_ENV || "development"
	});
});

app.get("/metrics", (req, res) => {
	res.json({
		uptime: process.uptime(),
		memory: process.memoryUsage(),
		timestamp: new Date().toISOString(),
		pid: process.pid
	});
});

// Créer la table en développement
async function createTableIfNotExists() {
	if (process.env.NODE_ENV === "development") {
		const dynamoClient = new AWS.DynamoDB(dynamoConfig);

		try {
			await dynamoClient.describeTable({ TableName: TABLE_NAME }).promise();
			console.log(`Table ${TABLE_NAME} existe déjà`);
		} catch (error) {
			if (error.code === "ResourceNotFoundException") {
				console.log(`Création de la table ${TABLE_NAME}...`);

				const params = {
					TableName: TABLE_NAME,
					KeySchema: [{ AttributeName: "id", KeyType: "HASH" }],
					AttributeDefinitions: [{ AttributeName: "id", AttributeType: "S" }],
					BillingMode: "PAY_PER_REQUEST",
				};

				await dynamoClient.createTable(params).promise();
				console.log(`Table ${TABLE_NAME} créée avec succès`);
			} else {
				console.error("Erreur lors de la vérification de la table:", error);
			}
		}
	}
}

// Routes API

// GET /todos - Récupérer toutes les tâches
app.get("/todos", async (req, res) => {
	try {
		const params = {
			TableName: TABLE_NAME,
		};

		const result = await dynamodb.scan(params).promise();
		res.json(result.Items || []);
	} catch (error) {
		console.error("Erreur lors de la récupération des todos:", error);
		res.status(500).json({ error: "Erreur serveur" });
	}
});

// POST /todos - Créer une nouvelle tâche
app.post("/todos", async (req, res) => {
	try {
		const { title, description } = req.body;

		if (!title) {
			return res.status(400).json({ error: "Le titre est requis" });
		}

		const todo = {
			id: Date.now().toString(),
			title,
			description: description || "",
			completed: false,
			createdAt: new Date().toISOString(),
			updatedAt: new Date().toISOString(),
		};

		const params = {
			TableName: TABLE_NAME,
			Item: todo,
		};

		await dynamodb.put(params).promise();
		res.status(201).json(todo);
	} catch (error) {
		console.error("Erreur lors de la création du todo:", error);
		res.status(500).json({ error: "Erreur serveur" });
	}
});

// PUT /todos/:id - Mettre à jour une tâche
app.put("/todos/:id", async (req, res) => {
	try {
		const { id } = req.params;
		const { title, description, completed } = req.body;

		if (!title) {
			return res.status(400).json({ error: "Le titre est requis" });
		}

		// Vérifier si l'item existe
		const getParams = {
			TableName: TABLE_NAME,
			Key: { id },
		};

		const existingItem = await dynamodb.get(getParams).promise();
		if (!existingItem.Item) {
			return res.status(404).json({ error: "Todo non trouvé" });
		}

		const params = {
			TableName: TABLE_NAME,
			Key: { id },
			UpdateExpression:
				"SET title = :title, description = :description, completed = :completed, updatedAt = :updatedAt",
			ExpressionAttributeValues: {
				":title": title,
				":description": description || "",
				":completed": completed || false,
				":updatedAt": new Date().toISOString(),
			},
			ReturnValues: "ALL_NEW",
		};

		const result = await dynamodb.update(params).promise();
		res.json(result.Attributes);
	} catch (error) {
		console.error("Erreur lors de la mise à jour du todo:", error);
		res.status(500).json({ error: "Erreur serveur" });
	}
});

// DELETE /todos/:id - Supprimer une tâche
app.delete("/todos/:id", async (req, res) => {
	try {
		const { id } = req.params;

		// Vérifier si l'item existe
		const getParams = {
			TableName: TABLE_NAME,
			Key: { id },
		};

		const existingItem = await dynamodb.get(getParams).promise();
		if (!existingItem.Item) {
			return res.status(404).json({ error: "Todo non trouvé" });
		}

		const params = {
			TableName: TABLE_NAME,
			Key: { id },
		};

		await dynamodb.delete(params).promise();
		res.status(204).send();
	} catch (error) {
		console.error("Erreur lors de la suppression du todo:", error);
		res.status(500).json({ error: "Erreur serveur" });
	}
});

app.use((error, req, res, next) => {
	console.error("Erreur non gérée:", error);
	res.status(500).json({ 
		error: "Erreur serveur interne",
		timestamp: new Date().toISOString()
	});
});

process.on('SIGTERM', () => {
	console.log('SIGTERM reçu, arrêt du serveur...');
	process.exit(0);
});

process.on('SIGINT', () => {
	console.log('SIGINT reçu, arrêt du serveur...');
	process.exit(0);
});

async function startServer() {
	try {
		await createTableIfNotExists();
		
		if (process.env.NODE_ENV === "production") {
			startMetricsCollection();
		}

		app.listen(PORT, "0.0.0.0", () => {
			console.log(`🚀 Serveur démarré sur le port ${PORT}`);
			console.log(`📊 Environnement: ${process.env.NODE_ENV || "development"}`);
			console.log(`📋 Table DynamoDB: ${TABLE_NAME}`);
			console.log(`🔗 Health check: http://localhost:${PORT}/health`);
			console.log(`metrique : http://localhost:${PORT}/metrics`);
		});
	} catch (error) {
		console.error("Erreur lors du démarrage du serveur:", error);
		process.exit(1);
	}
}

startServer();
