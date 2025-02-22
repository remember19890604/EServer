import fs from 'fs'
import fsPromises from 'fs/promises'
import FsUtil from '@/main/utils/FsUtil'

export default class FileUtil {
    /**
     * 创建文件符号链接
     * @param path {string} 符号链接的路径
     * @param pathToTarget {string} 符号链接指向的目标的路径
     * @returns {undefined}
     */
    static CreateSymbolicLink(path, pathToTarget) {
        return fs.symlinkSync(pathToTarget, path);
    }

    static async Delete(path, options = { force: true }) {
        return await FsUtil.Remove(path, options)
    }

    /**
     * 判断文件是否存在
     * @param path {string}
     * @returns {Promise<boolean>}
     */
    static async Exists(path) {
        return await FsUtil.Exists(path)
    }

    /**
     * 将文件移动到新位置，如果文件存在，则覆盖
     * @param oldPath {string}
     * @param newPath {string}
     * @returns {Promise<undefined>}
     */
    static async Move(oldPath, newPath) {
        return await FsUtil.Rename(oldPath, newPath)
    }

    static async Copy(source, dest, options = { force: true }) {
        return await FsUtil.Copy(source, dest, options)
    }

    /**
     * 读取文件的全部内容
     * @param path {string}
     * @param encoding {string|null}
     * @returns {Promise<string|Buffer>}
     */
    static async ReadAll(path, encoding = 'utf8') {
        return await fsPromises.readFile(path, { encoding })
    }

    /**
     * 创建一个新文件，将数据写入该文件，如果文件已经存在，则会覆盖该文件。
     * @param path {string}
     * @param data
     * @param encoding {string|null}
     * @returns {Promise<undefined>}
     */
    static async WriteAll(path, data, encoding = 'utf8') {
        return await fsPromises.writeFile(path, data, { encoding: encoding });
    }

    /**
     * 将数据追加到文件，如果文件不存在，则会创建该文件。
     * @param path {string}
     * @param data
     * @param options
     * @returns {Promise<undefined>}
     */
    static async Append(path, data, options = { encoding: 'utf8' }) {
        return await fsPromises.appendFile(path, data, options)
    }
}
