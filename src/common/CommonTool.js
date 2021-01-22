"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.removeDir = exports.createAndWriteFileSync = void 0;
var fs = __importStar(require("fs"));
var path = __importStar(require("path"));
function createAndWriteFileSync(filePath, content) {
    var arr = filePath.split(path.sep);
    var dir = arr[0];
    for (var i = 1; i < arr.length; i++) {
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir);
        }
        dir = path.join(dir, arr[i]);
    }
    if (content) {
        fs.writeFileSync(filePath, content);
    }
    else {
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir);
        }
    }
    console.log("写入文件/文件夹 " + filePath + " 成功");
}
exports.createAndWriteFileSync = createAndWriteFileSync;
function removeDir(dir) {
    if (fs.existsSync(dir)) {
        var files = fs.readdirSync(dir);
        for (var i = 0; i < files.length; i++) {
            var newPath = path.join(dir, files[i]);
            var stat = fs.statSync(newPath);
            if (stat.isDirectory()) {
                //如果是文件夹就递归下去
                removeDir(newPath);
            }
            else {
                //删除文件
                fs.unlinkSync(newPath);
            }
        }
        fs.rmdirSync(dir); //如果文件夹是空的，就将自己删除掉
        console.log("删除文件夹 " + dir);
    }
}
exports.removeDir = removeDir;
