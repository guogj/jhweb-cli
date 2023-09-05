# jhweb-cli
# 学习搭建cli脚手架

## 安装

### 全局安装
```bash
# mac要加sudo
npm install -g jhweb-cli
```
# or yarn
```bash
yarn global add jhweb-cli
```

### 使用
创建模版
```bash
jhweb-cli create <name> [-t|--template]
```
示例
```bash
jhweb-cli create helloProject -t demoProject
```

### 不全局安装，借助npx
创建模版
```bash
npx jhweb-cli create <name> [-t|--template]
```
示例
```bash
npx jhweb-cli create helloProject -template demoProject
```



### 项目发布到npm
```bash
#  要求登录npm账号密码
npm publish
```

