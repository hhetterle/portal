const jsonConfigurationName = "entertainBootMenuConfig";
const demoURL = "./sideload.json";

let currentView = "maincontainer";
let runningOnSTB = false;

interface IConfiguration {

    environmentGroup: EnvironmentType | "local";
    receiverGroup: ReceiverType;
    buildGroup: BuildType;
    subscriberGroup: string;
    loglevel: string;
    localbackendGroup: string;
    appname: string;
    extendedGroup: string;
    screensaver: string;
    update: string; //swUpdateSearchPostponeMs
    mqtt: MqttType;
}

type EnvironmentType = "t0" | "preprod" | "prod";
type ReceiverType = "mrentry" | "mr401" | "mrsat" | "mrg5";
type BuildType = "nightly" | "stable" | "fallback" | "es2015" | "vodpurchase" | "stable1";
type MqttType = "aws_t0" | "aws_sandbox" | "dev";
type ColumnNameType = keyof IConfiguration;

interface IConfigItem {
    env: EnvironmentType;
    model: ReceiverType;
    build: BuildType;
    url: string;
}

function callAjax(demoURL: string, callback: (data: string) => void) {

    const xmlhttp = new XMLHttpRequest();
    xmlhttp.onreadystatechange = () => {
        if (xmlhttp.readyState == 4 && xmlhttp.status == 200) {
            callback(xmlhttp.responseText);
        }
    };
    xmlhttp.open("GET", demoURL, true);
    xmlhttp.send();
}

let configuration: IConfiguration = {
    environmentGroup: "local",
    receiverGroup: "mrsat",
    buildGroup: "nightly",
    subscriberGroup: "SATHYBRID",
    mqtt: "aws_t0",
    loglevel: "debug",
    localbackendGroup: "preprod",
    appname: "ui20",
    extendedGroup: "full",
    screensaver: "1200000",
    update: "60000" //swUpdateSearchPostponeMs
};

let environmentList: IConfigItem[];

function commit() {
    uiToModel();
    const url = buildUrl();
    showUrl(url);
    saveModel(configuration);
    window.location.replace(url);
}

function modelToUI() {

    for (const key in configuration) {

        setValueForRadioGroup(key as ColumnNameType, configuration[key]);
    }
}

function uiToModel() {

    for (const key in configuration) {

        configuration[key] = getRadioValue(key as ColumnNameType, configuration[key]);
    }
}

function getData() {

    loadModel();
    loadDisabled();
    modelToUI();

    callAjax(demoURL, JSONdata => {
        try {
            environmentList = JSON.parse(JSONdata);
            const url = buildUrl();
            showUrl(url);
        }
        catch (e) {
            showMessage("Error at loading URL from Server.");
        }
    });
}

function disableGroup(groupName: ColumnNameType) {

    const items = document.querySelectorAll<HTMLInputElement>('input[name="' + groupName + '"]');

    for (const item of items) {

        item.setAttribute("disabled", "disabled");
    }

    if (items.length > 0) return findParentformcolumn(items[0]);

    return null;
}

function enableGroup(groupName: ColumnNameType) {

    const items = document.querySelectorAll<HTMLInputElement>('input[name="' + groupName + '"]');

    for (const item of items) {

        item.removeAttribute("disabled");
    }

    if (items.length > 0) return findParentformcolumn(items[0]);

    return null;
}

function loadDisabled() {

    if (configuration.environmentGroup != "local") {

        const node1 = enableGroup("buildGroup");
        if (node1) node1.className = "formcolumn";

        const node2 = disableGroup("localbackendGroup");
        if (node2) node2.className = "formcolumn disabled";
    }
    else {

        const node1 = disableGroup("buildGroup");
        if (node1) node1.className = "formcolumn disabled";

        const node2 = enableGroup("localbackendGroup");
        if (node2) node2.className = "formcolumn";
    }
}

function saveModel(config: IConfiguration) {

    try {

        const jsonData = JSON.stringify(config);
        localStorage.setItem(jsonConfigurationName, jsonData);

        showMessage("Configuration successfully saved.");
    }
    catch (e) {

        showMessage("Error at saving configuration.");
    }
}

function loadModel() {

    try {
        const loadedData = localStorage.getItem(jsonConfigurationName);
        if (loadedData) {
            const jsonData = JSON.parse(loadedData);
            if (jsonData) configuration = { ...configuration, ...jsonData };
        }
    }
    catch (e) {
        showMessage("Error at loading configuration.");
    }
}

function showUrl(url: string) {
    const elementUrl = document.getElementById("url");
    if (elementUrl) elementUrl.innerHTML = url;
}

function showMessage(message: string) {
    const elementMessage = document.getElementById("message");
    if (elementMessage) elementMessage.innerHTML = message;
}

function buildUrl() {

    let url: string;

    if (configuration.environmentGroup === "local") {

        let baseUrl = getUrlParameter("baseurl");
        if (!baseUrl) baseUrl = "http://192.168.2.222/appTvHostv2/index.html";

        url = baseUrl + "?";
    }
    else {

        const environment = environmentList.filter(env => {
            return env.env == configuration.environmentGroup
                && env.model.toUpperCase() == configuration.receiverGroup.toUpperCase()
                && env.build.toUpperCase() == configuration.buildGroup.toUpperCase();
        });

        try {
            url = environment[0].url;

            if (runningOnSTB) {

                url = url.replace("https://cto-tvd.github.io/portal/nightly/master/tu/", "https://appepidat10002.tu0.sngtv.t-online.de:33227/EPG/NIGHTLY/");
            }

            url = url + "?";
            showMessage("");
        }
        catch (e) {
            showMessage("There is no URL for this combination available.");
            return "";
        }
    }

    if (configuration.mqtt) {
        if (configuration.mqtt === "aws_sandbox") {
            url += "instrumentation.activeEndpoint=aws_sandbox&";
        }
        if (configuration.mqtt === "dev") {
            url += "instrumentation.activeEndpoint=dev&";
        }
    }

    if (configuration.environmentGroup === "local") {
        if (configuration.receiverGroup) {
            url += "features.assignment=" + configuration.receiverGroup + "&";
        }
        if (configuration.localbackendGroup) {
            url += "env=" + configuration.localbackendGroup + "&";
        }
    }

    if (configuration.loglevel) {
        url += "logging.loglevel=" + configuration.loglevel + "&";
    }

    if (configuration.subscriberGroup) {
        url += "subscriber_type=" + configuration.subscriberGroup + "&";
    }

    if (configuration.extendedGroup) {
        url += "features.featureStructure.assignment." + configuration.receiverGroup + ".rights.extendedui=" + configuration.extendedGroup + "&";
    }

    if (configuration.screensaver) {
        url += "timings.startScreenSaverMs=" + configuration.screensaver + "&";
    }

    if (configuration.update) {
        url += "timings.swUpdateSearchPostponeMs=" + configuration.update + "&";
    }

    return url;
}

function setValueForRadioGroup(groupName: ColumnNameType, value: string) {

    const items = document.querySelectorAll<HTMLInputElement>('input[name="' + groupName + '"]');

    for (const item of items) {

        if (item.value === value) {
            item.checked = true;
        }
    }
}

function showView(viewName: string) {

    const hideView = viewName == "maincontainer" ? "settingcontainer" : "maincontainer";
    currentView = viewName;

    let elements = document.getElementsByClassName(hideView);

    if (elements) {
        elements[0].className = hideView + " hidden";
    }

    elements = document.getElementsByClassName(viewName);

    if (elements) {
        elements[0].className = viewName;
    }

    focusFirst();
}

function getRadioValue(groupName: ColumnNameType, defaultValue: string) {

    const radioGroup = document.querySelector<HTMLInputElement>('input[name="' + groupName + '"]:checked');

    if (radioGroup)
        return radioGroup.value;
    else
        return defaultValue;
}

function radioFocus(event: FocusEvent) {
    const e = event || window.event;
    const element = e.target && (e.target as Node).parentNode as HTMLElement || e.srcElement && (e.srcElement as Node).parentNode as HTMLElement;

    if (element)
        element.className = "radioarea focus";
}

function radioBlur(event: FocusEvent) {

    const e = event || window.event;
    const element = e.target && (e.target as Node).parentNode as HTMLElement || e.srcElement && (e.srcElement as Node).parentNode as HTMLElement;

    if (element)
        element.className = "radioarea";
}

function addKeyhandling(inputs: HTMLCollectionOf<HTMLSelectElement> | HTMLCollectionOf<HTMLInputElement>) {

    for (const input of inputs) {

        if (input.className === "radioctrl") {

            input.onfocus = e => radioFocus(e);
            input.onblur = e => radioBlur(e);
        }

        input.onkeydown = e => {

            const targetElement = e.target as HTMLInputElement;

            /* OK key */
            if (e.keyCode == 13 && targetElement) {

                targetElement.checked = true;
                // changes to model
                uiToModel();

                if (targetElement.name == "environmentGroup") {

                    if (targetElement.value == "local") {
                        const node = disableGroup("buildGroup");
                        if (node) node.className = "formcolumn disabled";
                    }
                    else {
                        const node = enableGroup("buildGroup");
                        if (node) node.className = "formcolumn";
                    }
                }

                if (targetElement.name == "environmentGroup") {

                    if (targetElement.value != "local") {
                        const node = disableGroup("localbackendGroup");
                        if (node) node.className = "formcolumn disabled";
                    }
                    else {
                        const node = enableGroup("localbackendGroup");
                        if (node) node.className = "formcolumn";
                    }
                }

                modelToUI();
                showUrl(buildUrl());
            }

            /* DOWN key or UP key */
            if (e.keyCode == 40 || e.keyCode == 38) {
                focusNextPreviousInput(e, targetElement);
            }

            /* LEFT key or RIGHT key */
            if (e.keyCode == 37 || e.keyCode == 39) {
                focusNextPreviousColumn(e, targetElement);
            }

            //Back Key
            if (e.keyCode == 461) {
                showView("maincontainer");
            }
        };
    }
}

function focusFirst() {
    const element = currentView == "maincontainer" ? document.getElementById("commitbutton") : document.getElementById("backbutton");
    if (element) element.focus();
}

function focusNextPreviousColumn(e: KeyboardEvent, eventNode: HTMLElement) {

    const node = findParentformcolumn(eventNode);
    let nextNode: HTMLElement | null = null;

    if (node && node.className.indexOf("formcolumn") >= 0) {
        nextNode = (e.keyCode == 39) ? node.nextSibling && node.nextSibling.nextSibling as HTMLElement : node.previousSibling && node.previousSibling.previousSibling as HTMLElement;
        while (nextNode) {
            if (nextNode.className && nextNode.className.indexOf("formcolumn") >= 0 && nextNode.className.indexOf("disabled") == -1) break;
            nextNode = (e.keyCode == 39) ? nextNode.nextSibling && nextNode.nextSibling.nextSibling as HTMLElement : nextNode.previousSibling && nextNode.previousSibling.previousSibling as HTMLElement;
        }
        if (!nextNode) {
            nextNode = node.parentNode as HTMLElement;
            const collection = nextNode.getElementsByClassName("formcolumn") as HTMLCollectionOf<HTMLElement>;

            if (collection && collection.length > 0 && collection[0].className.indexOf("disabled") == -1) {
                nextNode = (e.keyCode == 39) ? collection[0] : collection[collection.length - 1];
            }
            else {
                nextNode = (e.keyCode == 39) ? collection[1] : collection[collection.length - 1];
            }
        }
    }
    focusFirstInputChild(e, nextNode);
}

function focusNextPreviousInput(e: KeyboardEvent, node: HTMLElement | null) {
    let nextNode = findParentArea(node);

    if (nextNode && nextNode.className && (nextNode.className.indexOf("radioarea") >= 0 || nextNode.className.indexOf("buttonarea") >= 0)) {
        e.preventDefault();
        // dependency to DOM structure. TODO other solution
        nextNode = (e.keyCode == 40) ? nextNode.nextSibling && nextNode.nextSibling.nextSibling as HTMLElement : nextNode.previousSibling && nextNode.previousSibling.previousSibling as HTMLElement;

        focusFirstInputChild(e, nextNode);
    }
}

function focusFirstInputChild(e: KeyboardEvent, nextNode: HTMLElement | null) {

    if (nextNode) {
        const nextInput = nextNode.querySelector("input");
        if (nextInput) nextInput.focus();
    }

    e.preventDefault();
    return false;
}

function findParentformcolumn(node: HTMLElement | null) {

    if (node === null) return null;

    let parent = node.parentNode as HTMLElement;

    while (parent) {
        if (parent.className.indexOf("formcolumn") >= 0) break;
        parent = parent.parentNode as HTMLElement;
    }

    return parent;
}

function findParentArea(node: HTMLElement | null) {

    if (node === null) return null;

    let nextNode = node.parentNode as HTMLElement;

    while (nextNode) {
        if (nextNode.className && (nextNode.className.indexOf("radioarea") >= 0 || nextNode.className.indexOf("buttonarea") >= 0)) break;
        nextNode = nextNode.parentNode as HTMLElement;
    }

    return nextNode;
}

function getUrlParameter(name: string) {

    name = name.replace(/[\[]/, "\\[").replace(/[\]]/, "\\]");
    const regex = new RegExp("[\\?&]" + name + "=([^&#]*)");
    const results = regex.exec(location.search);
    return results === null ? "" : decodeURIComponent(results[1].replace(/\+/g, " "));
}

function setTmwVersion() {

    const zacMockSystem = {

        GetSystemInformation: () => ({ SwProductVariant: "SwProductVariant Test" })
    };

    const objZacSystem = (document.getElementById("zac") || {} as any).System || zacMockSystem;
    const objSysInfo = objZacSystem.GetSystemInformation();

    const elementTmw = document.getElementById("tmw");
    if (elementTmw) elementTmw.innerHTML = objSysInfo.SwProductVariant;

    if (objSysInfo.SwProductVariant !== zacMockSystem.GetSystemInformation().SwProductVariant) {

        runningOnSTB = true;
    }
}

function startupPage() {

    addKeyhandling(document.getElementsByTagName("input"));
    addKeyhandling(document.getElementsByTagName("select"));

    focusFirst();
    getData();
    setTmwVersion();
}
