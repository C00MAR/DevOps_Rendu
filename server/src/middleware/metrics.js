const AWS = require("aws-sdk");

const cloudwatch = new AWS.CloudWatch({
	region: process.env.AWS_REGION || "eu-west-1",
});

const metrics = {
	requests: 0,
	errors: 0,
	requestDurations: [],
};

const metricsMiddleware = (req, res, next) => {
	const startTime = Date.now();
	metrics.requests++;

	const originalSend = res.send;
	res.send = function (data) {
		const duration = Date.now() - startTime;
		metrics.requestDurations.push(duration);

		if (res.statusCode >= 400) {
			metrics.errors++;
		}

		console.log(`${req.method} ${req.path} - ${res.statusCode} - ${duration}ms`);

		originalSend.call(this, data);
	};

	next();
};

const sendMetricsToCloudWatch = async () => {
	try {
		const now = new Date();
		const avgDuration =
			metrics.requestDurations.length > 0
				? metrics.requestDurations.reduce((a, b) => a + b, 0) / metrics.requestDurations.length
				: 0;

		const metricData = [
			{
				MetricName: "RequestCount",
				Value: metrics.requests,
				Unit: "Count",
				Timestamp: now,
				Dimensions: [
					{
						Name: "Service",
						Value: "TodoAppAPI",
					},
				],
			},
			{
				MetricName: "ErrorCount",
				Value: metrics.errors,
				Unit: "Count",
				Timestamp: now,
				Dimensions: [
					{
						Name: "Service",
						Value: "TodoAppAPI",
					},
				],
			},
			{
				MetricName: "AverageResponseTime",
				Value: avgDuration,
				Unit: "Milliseconds",
				Timestamp: now,
				Dimensions: [
					{
						Name: "Service",
						Value: "TodoAppAPI",
					},
				],
			},
		];

		if (metrics.requests > 0) {
			metricData.push({
				MetricName: "ErrorRate",
				Value: (metrics.errors / metrics.requests) * 100,
				Unit: "Percent",
				Timestamp: now,
				Dimensions: [
					{
						Name: "Service",
						Value: "TodoAppAPI",
					},
				],
			});
		}

		await cloudwatch
			.putMetricData({
				Namespace: "TodoApp/API",
				MetricData: metricData,
			})
			.promise();

		console.log(`metric sent : ${metrics.requests} requests, ${metrics.errors} errors`);

		metrics.requests = 0;
		metrics.errors = 0;
		metrics.requestDurations = [];
	} catch (error) {
		console.error("Error Envoie mettrics :", error);
	}
};

const startMetricsCollection = () => {
	setInterval(sendMetricsToCloudWatch, 5 * 60 * 1000);
};

module.exports = {
	metricsMiddleware,
	startMetricsCollection,
	sendMetricsToCloudWatch,
};
