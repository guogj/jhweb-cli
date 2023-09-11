#! /usr/bin/env node
const program = require("commander");
const inquirer = require("inquirer");
// 可以写死
const templates = require("./templates.js");
// 也可以通过api获取项目模版
// const { getGitReposList } = require("./apiTemplate.js"); // 新增
const package = require("../package.json");
// const downloadGitRepo = require("download-git-repo"); 在git下载慢不能用公司的gitlab
const gitPullOrClone = require("git-pull-or-clone");
const path = require("path");
const fs = require("fs-extra"); // 引入fs-extra
const ora = require("ora"); // 引入ora
// git命令函数
const { executeGitCommand } = require("./util.js");
// 合并 新建分支名
const originTemplate = "originTemplate";
// const chalk = require("chalk");
// 打印红色hello
// const h1 = chalk.red('hello');
// program.option("-a","this is test -a",()=>{
//     console.log(h1)
// })
const { log } = require("./log");
const { promisify } = require("util");
const figlet = promisify(require("figlet"));
const clear = require("clear");
clear(); //在执行的时候清空下控制台会更好哦~
log(
  figlet.textSync("JHWEB-CLI", {
    horizontalLayout: "Isometric1",
    verticalLayout: "default",
    width: 80,
    whitespaceBreak: true,
  }),
  "red"
);
// ...
program
  .command("create [projectName]")
  .description("创建模版")
  .option("-t, --template <template>", "模版名称")
  .action(async (projectName, options) => {
    // 添加获取模版列表接口和loading
    const getRepoLoading = ora("获取模版列表...");
    getRepoLoading.start();
    // guogj 指定项目git用户名
    // const templates = await getGitReposList("guogj");
    getRepoLoading.succeed("获取模版列表成功!");
    // 1. 从模版列表中找到对应的模版
    let project = templates.find(
      (template) => template.name === options.template
    );
    // 2. 如果匹配到模版就赋值，没有匹配到就是undefined
    let projectTemplate = project ? project.value : undefined;
    console.log("命令行参数：", projectName, projectTemplate);

    // 3. // 如果用户没有传入名称就交互式输入
    if (!projectName) {
      const { name } = await inquirer.prompt({
        type: "input",
        name: "name",
        message: "请输入项目名称：",
      });
      projectName = name; // 赋值输入的项目名称
    }
    console.log("项目名称：", projectName);
    // 4. 如果用户没有传入模版就交互式输入
    if (!projectTemplate) {
      const { template } = await inquirer.prompt({
        type: "list",
        name: "template",
        message: "请选择模版：",
        choices: templates, // 模版列表
      });
      projectTemplate = template; // 赋值选择的项目名称
    }
    console.log("模版：", projectTemplate);

    const dest = path.join(process.cwd(), projectName);
    // 判断文件夹是否存在，存在就交互询问用户是否覆盖
    if (fs.existsSync(dest)) {
      const { force } = await inquirer.prompt({
        type: "confirm",
        name: "force",
        message: `目录${projectName}已存在，是否覆盖？`,
      });
      // 如果覆盖就删除文件夹继续往下执行，否的话就退出进程
      force ? fs.removeSync(dest) : process.exit(1);
    }
    // 5. 开始下载模版
    // 测试下载
    // downloadGitRepo('github:vuejs/vue', 'my-project', err => {
    //     console.log('downloadGitRepo test github:vuejs/vue', err)
    //     if (err) {
    //       console.error(err);
    //     } else {
    //       console.log('下载完成');
    //     }
    //   });
    // 开始loading
    const loading = ora(`🚗🚗🚗正在下载模版${projectTemplate}...`);
    loading.start();
    // 5. 开始下载模版
    gitPullOrClone(projectTemplate, dest, (err) => {
      if (err) {
        loading.fail("创建模版失败：" + err); // 失败loading
      } else {
        loading.succeed("创建模版成功!"); // 成功loading
        if (
          projectTemplate ===
          "git@gitlab.jinhui365.cn:web/admin-template.git"
        ) {
          console.log(`\ncd ${projectName}`);
          console.log("pnpm install");
          console.log("pnpm serve\n");
          console.log(`git提交到远程终端用例：\n cd ${projectName} \n git remote rename origin old \n git remote add origin git@gitlab.jinhui365.cn:web/${projectName}.git \n git fetch --unshallow old \n git push --set-upstream origin
            `);
        } else {
          console.log(`\ncd ${projectName}`);
          console.log("npm i");
          console.log("npm run dev\n");
        }
      }
    });
  });
//   清除目录
program
  .command("del [projectNameDir]")
  .description("清除项目目录")
  .action(async (projectName, options) => {
    const dest = path.join(process.cwd(), projectName);
    // 判断文件夹是否存在，存在就交互询问用户是否覆盖
    if (fs.existsSync(dest)) {
      const { force } = await inquirer.prompt({
        type: "confirm",
        name: "force",
        message: `目录${projectName}是否删除？`,
      });
      // 如果覆盖就删除文件夹继续往下执行，否的话就退出进程
      force ? fs.removeSync(dest) : process.exit(1);
      console.log(`目录${projectName}删除成功！`);
    }
  });
//   git
program
  .command("merge [projectNameDir]")
  .description("模版项目master合并到当前项目originTemplate分支")
  .action(async (projectName, options) => {
    // 1. 从模版列表中找到对应的模版
    let project = templates.find(
      (template) => template.name === options.template
    );
    // 2. 如果匹配到模版就赋值，没有匹配到就是undefined
    let projectTemplate = project ? project.value : undefined;
    console.log("命令行参数：", projectName, projectTemplate);
    if (!projectTemplate) {
      const { template } = await inquirer.prompt({
        type: "list",
        name: "template",
        message: "请选择模版：",
        choices: templates, // 模版列表
      });
      projectTemplate = template; // 赋值选择的项目名称
    }
    console.log("projectTemplate 模版地址", projectTemplate);
    const loading = ora(`下载模版合并模版中🚴🏻🚴🏻...`);
    loading.start();
    //   把远程的全部更新的本地
    executeGitCommand("git fetch").then(() => {
        loading.succeed(`远程的全部更新的本地`);
      executeGitCommand("git checkout master").then(() => {
        loading.succeed(`切换到master`);
        // 示例：执行 'git remote get-url origin' 命令
        executeGitCommand(`git branch --list ${originTemplate}`).then(
          (output) => {
            // originTemplate 不存在
            console.log(
              "output originTemplate 是否存在",
              output,
              Boolean(output)
            );
            if (!Boolean(output)) {
              // 创建并切换到分支
              gitfn(originTemplate, projectTemplate,loading);
              loading.stop();
            } else {
              console.log("已经存在分支的情况");
              executeGitCommand("git checkout master").then(() => {
                loading.succeed(`切换分支到master`);
                // 强制删除本地分支
                executeGitCommand(`git branch -D ${originTemplate}`).then(
                  () => {
                    loading.succeed(`删除本地分支${originTemplate}`);
                  }
                );
                // 强制删除远程分支
                executeGitCommand(`git push origin --delete ${originTemplate}`)
                  .then(() => {
                    loading.succeed(`删除远程分支${originTemplate}成功！`);
                  })
                  .catch((error) => {
                    loading.fail(`删除远程分支${originTemplate}失败！`);
                  })
                  .finally(() => {
                    //调用
                    gitfn(originTemplate, projectTemplate, loading);
                    loading.stop();
                  });
              });
            }
            // 获取git 地址
            // git@gitlab.jinhui365.cn:gjguo/testgit.git
            //   console.log(output);
          }
        );
      });
    }).catch((error)=>{
        loading.fail(`请确认已经建立远程git项目，检查后再操作merge`);
        console.log(`提交到远程终端示例：
cd {projectName}
git remote rename origin old 
git remote add origin git@gitlab.jinhui365.cn:web/{projectName}.git 
git fetch --unshallow old 
git push --set-upstream origin`)
    });
    // console.log("模版：", projectTemplate);
  });

const gitfn = (originTemplate, projectTemplate, loading) => {
  // 创建并切换到分支
  executeGitCommand(`git checkout -b ${originTemplate}`)
    .then(() => {
      loading.succeed(`创建分支${originTemplate}成功！🚀🚀`);
    })
    .catch(() => {
      loading.fail(`创建分支${originTemplate}失败！😭😭`);
    });
  // 拉取模版分支地址
  executeGitCommand(`git pull ${projectTemplate} master`)
    .then(() => {
      loading.succeed(`拉取远程模版${projectTemplate}成功！🚀🚀`);
    })
    .catch(() => {
    //   loading.fail(`拉取远程模版${projectTemplate}失败！😭😭`);
    })
    .finally(() => {
      // 合并
      executeGitCommand(`git merge ${projectTemplate}/master`)
        .then(() => {
          loading.succeed(`远程模版合并${originTemplate}分支成功！🚀🚀`);
        })
        .catch(() => {
        //   loading.fail(`远程模版合并${originTemplate}分支失败！😭😭
        //   git merge ${projectTemplate}/master
        //   `);
          // console.log(`合并代码可能有冲突，请手动处理冲突，并提交到${originTemplate} 分支`)
        })
        .finally(() => {
          // executeGitCommand(`git merge --abort`);
          executeGitCommand(`git add .`).then(() => {
            // executeGitCommand(`git commit -am 'feat(function): add template'`);
            executeGitCommand(`git push --force origin ${originTemplate}`);
            loading.fail(
              `如果合并不成功，可能因为代码冲突导致，请手动合并代码，提交到${originTemplate} 分支`
            );
            loading.fail(` 代码示例如下：
            git add .
            git commit -am 'feat(function): add template'
            git push --set-upstream origin ${originTemplate}
            `);
          });
        });
    });
};

// 定义当前版本
program.version(`v${package.version}`);
program.on("--help", () => {}); // 添加--help
program.parse(process.argv);
