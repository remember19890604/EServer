import Nginx from "@/main/core/Nginx";
import {EOL} from "os";
import {CONF_INDENT} from "@/main/utils/constant";
import FileUtil from "@/main/utils/FileUtil";
import Path from "@/main/utils/Path";

const N = EOL; //换行符
const T = CONF_INDENT; //缩进符

/**
 * 用去获取和设置Nginx站点配置
 */
export default class NginxWebsite {
    serverName;
    confName;
    confPath;
    confText;

    /**
     *
     * @param confName 配置文件名，带扩展名
     */
    constructor(confName) {
        this.confName = confName
    }

    async init() {
        this.serverName = Path.GetFileNameWithoutExtension(this.confName).split('_')[0]
        this.confPath = Nginx.getWebsiteConfPath(this.confName)
        this.confText = await FileUtil.ReadAll(this.confPath)
    }

    getBasicInfo() {
        const extraInfo = this.getExtraInfo()
        return {
            confName: this.confName,
            serverName: this.serverName,
            extraServerName: this.getExtraServerName(),
            port: this.getPort(),
            rootPath: this.getRootPath(),
            phpVersion: this.getPHPVersion() ?? '',
            syncHosts: extraInfo?.syncHosts ?? false,
            note: extraInfo?.note ?? '',
        }
    }

    getExtraServerName() {
        const allServerName = Nginx.getAllServerName(this.confText)
        //目前只获取第二个域名
        return allServerName[1] ?? null
    }

    static async getRewrite(confName) {
        let rewritePath = Nginx.getWebsiteRewriteConfPath(confName);
        return await FileUtil.ReadAll(rewritePath);
    }

    getPort() {
        let matches = this.confText.match(/(?<=listen\s+)\d+(?=\s*;)/);
        return matches ? parseInt(matches[0]) : null;
    }

    getRootPath() {
        let matches = this.confText.match(/(?<=root\s+)\S+(?=\s*;)/);
        return matches ? matches[0] : null;
    }

    getPHPVersion() {
        let matches = this.confText.match(/php-(\S+?)\.conf/);
        return matches ? matches[1] : null;
    }

    getExtraInfo(key = null) {
        let matches = this.confText.match(/(?<=#EXTRA_INFO_START[\s\S]{0,9}#).*(?=[\s\S]{0,9}#EXTRA_INFO_END)/);
        if (!matches || !matches[0]) {
            return null;
        }
        let extraObj;
        try {
            extraObj = JSON.parse(matches[0]) ?? {};
        } catch {
            return null;
        }

        return key ? extraObj[key] : extraObj;
    }

    async setBasicInfo(websiteInfo) {
        let text = this.confText;
        let serverNameStr;
        let extraServerName = websiteInfo.extraServerName
        if (extraServerName) {
            if (extraServerName !== this.getExtraServerName())
                if (await Nginx.websiteExists(extraServerName, websiteInfo.port)) {
                    throw new Error(`${extraServerName}:${websiteInfo.port}\n已经存在，不能重复！`)
                }
            serverNameStr = `server_name ${this.serverName} ${extraServerName};`
        } else {
            serverNameStr = `server_name ${this.serverName};`;
        }
        text = text.replace(/server_name\s+[^\s;]+\s*(.+)?\s*;/, serverNameStr);
        text = text.replace(/(?<=listen\s+)\d+(?=\s*;)/, websiteInfo.port);
        text = text.replace(/(?<=root\s+)\S+(?=\s*;)/, websiteInfo.rootPath);
        this.confText = text;
        this.setPHPVersion(websiteInfo.phpVersion);
        this.setExtraInfo({ syncHosts: websiteInfo.syncHosts, note: websiteInfo.note });
        await FileUtil.WriteAll(this.confPath, this.confText);
    }

    static async saveRewrite(confName, content) {
        let rewritePath = Nginx.getWebsiteRewriteConfPath(confName);
        await FileUtil.WriteAll(rewritePath, content);
    }

    /**
     * 替换配置文件中的PHP版本
     * @param  phpVersion {string}
     */
     setPHPVersion(phpVersion) {
        let phpPattern = /(?<=#PHP_START)[\s\S]+?(?=#PHP_END)/;
        let phpReplace;
        if (phpVersion) {
            phpReplace = `${N}${T}include php/php-${phpVersion}.conf;${N}${T}`;
        } else {
            phpReplace = `${N}${T}`;
        }
        this.confText  = this.confText.replace(phpPattern, phpReplace);
    }

    setExtraInfo(obj) {
        let extraObj = this.getExtraInfo() ?? {};
        Object.assign(extraObj, obj);
        let extraStr = JSON.stringify(extraObj);
        this.confText = this.confText.replace(/(?<=#EXTRA_INFO_START[\s\S]{0,9}#).*(?=[\s\S]{0,9}#EXTRA_INFO_END)/, extraStr);
    }

    async save() {
        await FileUtil.WriteAll(this.confPath, this.confText);
    }
}
