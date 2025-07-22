set -e

REGION=${region}
DYNAMODB_TABLE=${dynamodb_table}
ECR_REGISTRY=${ecr_registry}

yum update -y

yum install -y docker
systemctl start docker
systemctl enable docker

usermod -a -G docker ec2-user

curl -L "https://github.com/docker/compose/releases/download/v2.21.0/docker-compose-linux-x86_64" -o /usr/local/bin/docker-compose
chmod +x /usr/local/bin/docker-compose

curl "https://awscli.amazonaws.com/awscli-exe-linux-x86_64.zip" -o "awscliv2.zip"
yum install -y unzip
unzip awscliv2.zip
./aws/install
rm -f awscliv2.zip
rm -rf aws

yum install -y git

curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"
[ -s "$NVM_DIR/bash_completion" ] && \. "$NVM_DIR/bash_completion"

cat >> /home/ec2-user/.bashrc << EOL

# Variables
export AWS_DEFAULT_REGION=$REGION
export DYNAMODB_TABLE_NAME=$DYNAMODB_TABLE
export ECR_REGISTRY=$ECR_REGISTRY

# docker-compose PATH
export PATH="/usr/local/bin:$PATH"

# ECR Login
ecr-login() {
    aws ecr get-login-password --region $REGION | docker login --username AWS --password-stdin $ECR_REGISTRY
}

EOL

mkdir -p /home/ec2-user/app
chown ec2-user:ec2-user /home/ec2-user/app

chmod +x /home/ec2-user/app/deploy-help.sh
chown ec2-user:ec2-user /home/ec2-user/app/deploy-help.sh

yum install -y htop

yum install -y amazon-cloudwatch-agent

echo "User data script completed successfully at $(date)" > /var/log/user-data.log
echo "Instance ready for todo-app deployment" >> /var/log/user-data.log

systemctl restart docker

wall "Todo App EC2 instance is ready! Run '/home/ec2-user/app/deploy-help.sh' for deployment instructions."