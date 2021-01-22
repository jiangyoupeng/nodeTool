import * as fs from "fs"
import * as path from "path"

export function createAndWriteFileSync(filePath: string, content?: any) {
    const arr = path.normalize(filePath).split(path.sep)
    console.log(" path.normalize(filePath) " + path.normalize(filePath))
    let dir = arr[0]
    for (let i = 1; i < arr.length; i++) {
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir)
        }
        dir = path.join(dir, arr[i])
    }
    if (content) {
        fs.writeFileSync(filePath, content)
    } else {
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir)
        }
    }
    console.log("写入文件/文件夹 " + filePath + " 成功")
}

export function removeDir(dir: string) {
    if (fs.existsSync(dir)) {
        let files = fs.readdirSync(dir)
        for (var i = 0; i < files.length; i++) {
            let newPath = path.join(dir, files[i])
            let stat = fs.statSync(newPath)
            if (stat.isDirectory()) {
                //如果是文件夹就递归下去
                removeDir(newPath)
            } else {
                //删除文件
                fs.unlinkSync(newPath)
            }
        }
        fs.rmdirSync(dir) //如果文件夹是空的，就将自己删除掉
        console.log("删除文件夹 " + dir)
    }
}
