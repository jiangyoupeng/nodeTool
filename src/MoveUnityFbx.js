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
// 该工具用于迁移unity的g3项目的fbx
var readline_1 = require("readline");
var rd_1 = require("rd");
var fs = __importStar(require("fs"));
var path_1 = require("path");
var CommonTool_1 = require("./common/CommonTool");
var r1 = readline_1.createInterface({
    input: process.stdin,
    output: process.stdout,
});
r1.question("请输入要提取的目录", function (answer) {
    r1.question("请输入要转移的目录", function (moveAnswer) {
        var dirs = fs.readdirSync(answer);
        console.log(dirs);
        dirs.forEach(function (dir) {
            var filedir = path_1.join(answer, dir);
            var stats = fs.statSync(filedir);
            if (stats.isDirectory()) {
                console.log("提取目录 " + filedir);
                var files = rd_1.readFileSync(filedir);
                files.forEach(function (filePath) {
                    if (filePath.indexOf(".FBX") === filePath.length - 4 || filePath.indexOf(".png") === filePath.length - 4) {
                        var subName = filePath.substr(filedir.length);
                        var moveToPath = path_1.join(moveAnswer, dir, subName);
                        moveToPath = moveToPath.replace("Materials", "materials");
                        console.log("oldPath:" + filePath);
                        console.log("move to:" + moveToPath);
                        CommonTool_1.createAndWriteFileSync(moveToPath, fs.readFileSync(filePath));
                    }
                });
            }
        });
    });
});
