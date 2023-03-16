import Nginx from "@/main/core/Nginx";
import NginxWebsite from "@/main/core/website/NginxWebsite";
import File from "@/main/utils/File";
import Directory from "@/main/utils/Directory";

export default class Website {
    /**
     *
     * @param websiteInfo {WebsiteItem}
     */
    static add(websiteInfo) {
        if (Nginx.websiteExists(websiteInfo.serverName, websiteInfo.port)) {
            throw new Error('网站已经存在！');
        }
        if (!File.Exists(websiteInfo.rootPath)) {
            try {
                Directory.CreateDirectory(websiteInfo.rootPath)
            } catch {
                throw new Error('创建根目录失败！');
            }
        }
        Nginx.addWebsite(websiteInfo);
    }

    static delete(confName) {
        Nginx.delWebsite(confName);
    }

    static async getList(search) {
        return await Nginx.getWebsiteList(search);
    }

    static  getBasicInfo(confName) {
        let webSite = new NginxWebsite(confName);
        return  webSite.getBasicInfo();
    }

    static getRewrite(confName) {
        return NginxWebsite.getRewrite(confName);
    }

    static getConfPath(confName) {
        return Nginx.getWebsiteConfPath(confName);
    }

    static getRewriteConfPath(confName) {
        return Nginx.getWebsiteRewriteConfPath(confName);
    }

    /**
     * 获取URL重写规则列表
     * @returns {Promise<string[]>}
     */
    static getRewriteRuleList() {
        return Nginx.getRewriteRuleList();
    }

    static getRewriteByRule(ruleName) {
        return Nginx.getRewriteByRule(ruleName);
    }

    static saveBasicInfo(confName, websiteInfo) {
        let webSite = new NginxWebsite(confName);
        webSite.setBasicInfo(websiteInfo);
        webSite.save();
    }

    static saveRewrite(confName, content) {
        NginxWebsite.saveRewrite(confName, content);
    }

    /**
     *
     * @param domain
     * @returns {Promise<number>}
     */
    static async getSameDomainAmount(domain) {
        return await Nginx.getSameDomainAmount(domain);
    }
}
