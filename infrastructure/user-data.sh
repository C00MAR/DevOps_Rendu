#!/bin/bash
set -e

REGION=${region}
DYNAMODB_TABLE=${dynamodb_table}
ECR_REGISTRY=${ecr_registry}

yum update -y

yum install -y docker
systemctl start docker
systemctl enable docker

usermod -a -G docker ec2-user

mkdir -p /usr/local/lib/docker/cli-plugins
curl -SL "https://github.com/docker/compose/releases/download/v2.21.0/docker-compose-linux-x86_64" -o /usr/local/lib/docker/cli-plugins/docker-compose
chmod +x /usr/local/lib/docker/cli-plugins/docker-compose

ln -sf /usr/local/lib/docker/cli-plugins/docker-compose /usr/local/bin/docker-compose
chmod +x /usr/local/bin/docker-compose

curl "https://awscli.amazonaws.com/awscli-exe-linux-x86_64.zip" -o "awscliv2.zip"
yum install -y unzip
unzip awscliv2.zip
./aws/install
rm -f awscliv2.zip
rm -rf aws

yum install -y git htop wget

cat >> /home/ec2-user/.bashrc << EOL

export AWS_DEFAULT_REGION=$REGION
export DYNAMODB_TABLE_NAME=$DYNAMODB_TABLE
export ECR_REGISTRY=$ECR_REGISTRY

export PATH="/usr/local/bin:/usr/local/lib/docker/cli-plugins:\$PATH"

alias docker-compose='/usr/local/bin/docker-compose'

ecr-login() {
    aws ecr get-login-password --region $REGION | docker login --username AWS --password-stdin $ECR_REGISTRY
}

EOL

mkdir -p /home/ec2-user/todo-app
chown -R ec2-user:ec2-user /home/ec2-user/todo-app

yum install -y amazon-cloudwatch-agent

systemctl restart docker

sleep 10

echo "User data script completed at $(date)" > /var/log/user-data.log
echo "Instance ready deployment" >> /var/log/user-data.log
