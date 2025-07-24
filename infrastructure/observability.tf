resource "aws_cloudwatch_log_group" "client_logs" {
  name              = "/aws/ec2/todo-app/client"
  retention_in_days = 7

  tags = {
    Name = "${var.project_name}-client-logs"
    Type = "Application"
  }
}

resource "aws_cloudwatch_log_group" "server_logs" {
  name              = "/aws/ec2/todo-app/server"
  retention_in_days = 7

  tags = {
    Name = "${var.project_name}-server-logs"
    Type = "Application"
  }
}

resource "aws_cloudwatch_log_group" "ec2_logs" {
  name              = "/aws/ec2/todo-app/instance"
  retention_in_days = 7

  tags = {
    Name = "${var.project_name}-ec2-logs"
    Type = "Infrastructure"
  }
}

resource "aws_cloudwatch_metric_alarm" "high_cpu" {
  alarm_name          = "${var.project_name}-high-cpu"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "2"
  metric_name         = "CPUUtilization"
  namespace           = "AWS/EC2"
  period              = "300"
  statistic           = "Average"
  threshold           = "80"
  alarm_description   = "This metric monitors ec2 cpu utilization"
  alarm_actions       = [aws_sns_topic.alerts.arn]

  dimensions = {
    InstanceId = aws_instance.web.id
  }

  tags = {
    Name = "${var.project_name}-high-cpu-alarm"
  }
}

resource "aws_iam_role_policy" "ec2_cloudwatch_policy" {
  name = "${var.project_name}-ec2-cloudwatch-policy"
  role = aws_iam_role.ec2_role.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "logs:CreateLogGroup",
          "logs:CreateLogStream",
          "logs:PutLogEvents",
          "logs:DescribeLogStreams",
          "logs:DescribeLogGroups"
        ]
        Resource = [
          "arn:aws:logs:${var.aws_region}:*:log-group:/aws/ec2/todo-app/*",
          "arn:aws:logs:${var.aws_region}:*:log-group:/aws/ec2/todo-app/*:*"
        ]
      },
      {
        Effect = "Allow"
        Action = [
          "cloudwatch:PutMetricData",
          "cloudwatch:GetMetricStatistics",
          "cloudwatch:ListMetrics"
        ]
        Resource = "*"
      },
      {
        Effect = "Allow"
        Action = [
          "ssm:GetParameter",
          "ssm:GetParameters",
          "ssm:GetParametersByPath"
        ]
        Resource = [
          "arn:aws:ssm:${var.aws_region}:*:parameter/todo-app/*"
        ]
      }
    ]
  })
}

resource "aws_ssm_parameter" "cloudwatch_config" {
  name  = "/todo-app/cloudwatch-agent-config"
  type  = "String"
  value = jsonencode({
    agent = {
      metrics_collection_interval = 60
      run_as_user                 = "root"
    }
    metrics = {
      namespace = "TodoApp/EC2"
      metrics_collected = {
        cpu = {
          measurement = [
            "cpu_usage_idle",
            "cpu_usage_iowait",
            "cpu_usage_user",
            "cpu_usage_system"
          ]
          metrics_collection_interval = 60
        }
        disk = {
          measurement = [
            "used_percent"
          ]
          metrics_collection_interval = 60
          resources = [
            "*"
          ]
        }
        diskio = {
          measurement = [
            "io_time"
          ]
          metrics_collection_interval = 60
          resources = [
            "*"
          ]
        }
        mem = {
          measurement = [
            "mem_used_percent"
          ]
          metrics_collection_interval = 60
        }
      }
    }
    logs = {
      logs_collected = {
        files = {
          collect_list = [
            {
              file_path      = "/var/log/messages"
              log_group_name = aws_cloudwatch_log_group.ec2_logs.name
              log_stream_name = "{instance_id}/var/log/messages"
            },
            {
              file_path      = "/var/log/docker"
              log_group_name = aws_cloudwatch_log_group.ec2_logs.name
              log_stream_name = "{instance_id}/var/log/docker"
            }
          ]
        }
      }
    }
  })

  tags = {
    Name = "${var.project_name}-cloudwatch-config"
  }
}

output "cloudwatch_logs_urls" {
  description = "URLs des logs CloudWatch"
  value = {
    client_logs = "https://${var.aws_region}.console.aws.amazon.com/cloudwatch/home?region=${var.aws_region}#logsV2:log-groups/log-group/${replace(aws_cloudwatch_log_group.client_logs.name, "/", "%2F")}"
    server_logs = "https://${var.aws_region}.console.aws.amazon.com/cloudwatch/home?region=${var.aws_region}#logsV2:log-groups/log-group/${replace(aws_cloudwatch_log_group.server_logs.name, "/", "%2F")}"
    ec2_logs    = "https://${var.aws_region}.console.aws.amazon.com/cloudwatch/home?region=${var.aws_region}#logsV2:log-groups/log-group/${replace(aws_cloudwatch_log_group.ec2_logs.name, "/", "%2F")}"
  }
}

output "cloudwatch_agent_config" {
  description = "Commande pour configurer CloudWatch Agent"
  value       = "/opt/aws/amazon-cloudwatch-agent/bin/amazon-cloudwatch-agent-ctl -a fetch-config -m ec2 -c ssm:${aws_ssm_parameter.cloudwatch_config.name} -s"
}
