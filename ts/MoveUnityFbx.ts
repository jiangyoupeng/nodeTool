// 该工具用于迁移unity的g3项目的fbx
import { createInterface } from "readline"
import { readFileSync } from "rd"
import * as fs from "fs"
import { join } from "path"
import { createAndWriteFileSync } from "./common/CommonTool"

let r1 = createInterface({
    input: process.stdin,
    output: process.stdout,
})

r1.question("请输入要提取的目录", (answer: string) => {
    r1.question("请输入要转移的目录", (moveAnswer: string) => {
        let dirs = fs.readdirSync(answer)
        console.log(dirs)
        dirs.forEach((dir) => {
            var filedir = join(answer, dir)
            let stats = fs.statSync(filedir)
            if (stats.isDirectory()) {
                console.log("提取目录 " + filedir)
                let files = readFileSync(filedir)
                files.forEach((filePath) => {
                    if (filePath.indexOf(".FBX") === filePath.length - 4 || filePath.indexOf(".png") === filePath.length - 4) {
                        let subName = filePath.substr(filedir.length)
                        let moveToPath = join(moveAnswer, dir, subName)
                        moveToPath = moveToPath.replace("Materials", "materials")
                        console.log("oldPath:" + filePath)
                        console.log("move to:" + moveToPath)
                        createAndWriteFileSync(moveToPath, fs.readFileSync(filePath))
                    }
                })
            }
        })
    })
})
