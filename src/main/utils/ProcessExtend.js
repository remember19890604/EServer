import Command from '@/main/utils/Command'
import { isMacOS, isWindows } from '@/main/utils/utils'

export default class ProcessExtend {
    /**
     *  杀死进程和子进程
     * @param pid {number}
     * @returns {Promise<*>}
     */
    static async kill(pid) {
        try {
            if (isWindows) {
                //taskkill杀不存在的进程会有标准错误，从而引发异常
                await Command.exec(`taskkill /f /t /pid ${pid}`);
            } else {
                //pkill杀不存在的进程会有标准错误，从而引发异常
                await Command.sudoExec(`kill ${pid}`);
            }
            // eslint-disable-next-line no-empty
        } catch {

        }
    }

    /**
     * 杀死进程和子进程
     * @param name {string}
     * @returns {Promise<*>}
     */
    static async killByName(name) {
        try {
            if (isWindows) {
                //taskkill杀不存在的进程会有标准错误，从而引发异常
                await Command.exec(`taskkill /f /t /im ${name}`);
            } else {
                //pkill杀不存在的进程会有标准错误，从而引发异常
                await Command.sudoExec(`pkill ${name}`);
            }
            // eslint-disable-next-line no-empty
        } catch {

        }
    }

    static pidIsRunning(pid) {
        try {
            process.kill(pid, 0);
            return true;
        } catch (e) {
            return false;
        }
    }

    static async getPathByPid(pid) {
        try {
            let commandStr, resStr, path;

            if (isWindows) {
                commandStr = `(Get-Process -Id ${pid}).Path`;
                resStr = await Command.exec(commandStr, {shell: 'powershell'});
            } else {
                commandStr = `lsof -p ${pid} -a -w -d txt -Fn|awk 'NR==3{print}'|sed "s/n//"`;
                resStr = await Command.exec(commandStr);
            }
            path = resStr.trim().split("\n")[0];
            return path.trim();
        } catch {
            return null;
        }
    }

    /**
     *
     * @returns {Promise<Awaited<*>[]>}
     */
    static async killWebServer() {
        return await Promise.all([
            this.killByName('httpd'),
            this.killByName('nginx'),
        ]);
    }

    /**
     *
     * @param options {object}
     * @returns {Promise<[]|{path: *, name: *, pid: *, ppid: *}[]>}
     */
    static async getList(options={}) {
        if (isMacOS) {
            return await this.getListForMacOS(options);
        } else if (isWindows) {
            return await this.getListForWindows(options);
        }
        return [];
    }

    static async getListForMacOS(options={}) {
        let command = 'lsof -w -R -d txt';
        if (options) {
            if(options.directory){
                command += `|grep ${options.directory}`;  //这里不能使用lsof的+D参数，会有exit code，且性能不好
            }
        }
        command += "|grep -v .dylib|awk '{print $1,$2,$3,$10}'";
        try {
            let str =  await Command.sudoExec(command);
            str = str.trim();
            if(!str){
                return [];
            }
            let list = str.split('\n');

            list = list.map(item => {
                let arr = item.split(' ');
                let name, pid, ppid, path;
                [name, pid, ppid, path] = arr;
                return {name, pid, ppid, path};
            });

            return list;
        } catch (e) {
            return []
        }

    }

    static async getListForWindows(options={}) {
        let command = ' Get-WmiObject -Class Win32_Process -Filter ';
        if (options) {
            if(options.directory){
                let formatDir = options.directory.replaceAll('\\', '\\\\')
                //这里只能是ExecutablePath不能是Path，因为Path是PowerShell的'ScriptProperty'
                command += `"ExecutablePath like '${formatDir}%'"`;
            }
        }
        command += " |Select-Object Name,ProcessId,ParentProcessId,ExecutablePath | Format-List | Out-String -Width 999";

        try {
            let str =  await Command.exec(command,{shell: 'powershell'});
            str = str.trim();
            if(!str){
                return [];
            }
            let list = str.split(/\r?\n\r?\n/);
            list = list.map(item => {
                let lineArr = item.split(/\r?\n/);

                let arr = lineArr.map(line =>{
                    return line.split(' : ')[1]?.trim()
                });

                let name, pid, ppid, path;
                [name, pid, ppid, path] = arr;
                return {name, pid, ppid, path};
            });
            return list;
        } catch (e) {
            return []
        }
    }
}
