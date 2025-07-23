output "instance_id" {
  description = "ID of the EC2 instance"
  value       = aws_instance.web.id
}

output "instance_public_ip" {
  description = "Public IP address of the EC2 instance"
  value       = aws_instance.web.public_ip
}

output "instance_public_dns" {
  description = "Public DNS name of the EC2 instance"
  value       = aws_instance.web.public_dns
}

output "instance_private_ip" {
  description = "Private IP address of the EC2 instance"
  value       = aws_instance.web.private_ip
}

output "dynamodb_table_name" {
  description = "Name of the DynamoDB table"
  value       = aws_dynamodb_table.todos.name
}

output "dynamodb_table_arn" {
  description = "ARN of the DynamoDB table"
  value       = aws_dynamodb_table.todos.arn
}

output "ecr_client_repository_url" {
  description = "URL of the ECR repository for client"
  value       = aws_ecr_repository.client.repository_url
}

output "ecr_server_repository_url" {
  description = "URL of the ECR repository for server"
  value       = aws_ecr_repository.server.repository_url
}

output "vpc_id" {
  description = "ID of the VPC"
  value       = aws_vpc.main.id
}

output "public_subnet_id" {
  description = "ID of the public subnet"
  value       = aws_subnet.public.id
}

output "security_group_id" {
  description = "ID of the security group"
  value       = aws_security_group.web.id
}

output "aws_region" {
  description = "AWS region used"
  value       = var.aws_region
}

output "aws_account_id" {
  description = "AWS Account ID"
  value       = data.aws_caller_identity.current.account_id
}

output "app_urls" {
  description = "URLs to access the application"
  value = {
    frontend = "http://${aws_instance.web.public_ip}:3000"
    api      = "http://${aws_instance.web.public_ip}:5001"
    ssh      = "ssh -i ${var.key_pair_name}.pem ec2-user@${aws_instance.web.public_ip}"
  }
}

output "useful_commands" {
  description = "Useful commands for deployment"
  value = {
    ssh_connect = "ssh -i ${var.key_pair_name}.pem ec2-user@${aws_instance.web.public_ip}"
    ecr_login   = "aws ecr get-login-password --region ${var.aws_region} | docker login --username AWS --password-stdin ${data.aws_caller_identity.current.account_id}.dkr.ecr.${var.aws_region}.amazonaws.com"
  }
}
