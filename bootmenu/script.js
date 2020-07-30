"use strict";
const jsonConfigurationName = "entertainBootMenuConfig";
const demoURL = "./sideload.json";
let currentView = "maincontainer";
let runningOnSTB = true;
function callAjax(demoURL, callback) {
    const xmlhttp = new XMLHttpRequest();
    xmlhttp.onreadystatechange = () => {
        if (xmlhttp.readyState == 4 && xmlhttp.status == 200) {
            callback(xmlhttp.responseText);
        }
    };
    xmlhttp.open("GET", demoURL, true);
    xmlhttp.send();
}
let configuration = {
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
    update: "60000"
};
let environmentList;
function commit() {
    uiToModel();
    const url = buildUrl();
    showUrl(url);
    saveModel(configuration);
    window.location.replace(url);
}
function modelToUI() {
    for (const key in configuration) {
        setValueForRadioGroup(key, configuration[key]);
    }
}
function uiToModel() {
    for (const key in configuration) {
        configuration[key] = getRadioValue(key, configuration[key]);
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
function disableGroup(groupName) {
    const items = document.querySelectorAll('input[name="' + groupName + '"]');
    for (const item of items) {
        item.setAttribute("disabled", "disabled");
    }
    if (items.length > 0)
        return findParentformcolumn(items[0]);
    return null;
}
function enableGroup(groupName) {
    const items = document.querySelectorAll('input[name="' + groupName + '"]');
    for (const item of items) {
        item.removeAttribute("disabled");
    }
    if (items.length > 0)
        return findParentformcolumn(items[0]);
    return null;
}
function loadDisabled() {
    if (configuration.environmentGroup != "local") {
        const node1 = enableGroup("buildGroup");
        if (node1)
            node1.className = "formcolumn";
        const node2 = disableGroup("localbackendGroup");
        if (node2)
            node2.className = "formcolumn disabled";
    }
    else {
        const node1 = disableGroup("buildGroup");
        if (node1)
            node1.className = "formcolumn disabled";
        const node2 = enableGroup("localbackendGroup");
        if (node2)
            node2.className = "formcolumn";
    }
}
function saveModel(config) {
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
            if (jsonData)
                configuration = Object.assign(Object.assign({}, configuration), jsonData);
        }
    }
    catch (e) {
        showMessage("Error at loading configuration.");
    }
}
function showUrl(url) {
    const elementUrl = document.getElementById("url");
    if (elementUrl)
        elementUrl.innerHTML = url;
}
function showMessage(message) {
    const elementMessage = document.getElementById("message");
    if (elementMessage)
        elementMessage.innerHTML = message;
}
function buildUrl() {
    let url;
    if (configuration.environmentGroup === "local") {
        let baseUrl = getUrlParameter("baseurl");
        if (!baseUrl)
            baseUrl = "http://192.168.2.222/appTvHostv2/index.html";
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
function setValueForRadioGroup(groupName, value) {
    const items = document.querySelectorAll('input[name="' + groupName + '"]');
    for (const item of items) {
        if (item.value === value) {
            item.checked = true;
        }
    }
}
function showView(viewName) {
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
function getRadioValue(groupName, defaultValue) {
    const radioGroup = document.querySelector('input[name="' + groupName + '"]:checked');
    if (radioGroup)
        return radioGroup.value;
    else
        return defaultValue;
}
function radioFocus(event) {
    const e = event || window.event;
    const element = e.target && e.target.parentNode || e.srcElement && e.srcElement.parentNode;
    if (element)
        element.className = "radioarea focus";
}
function radioBlur(event) {
    const e = event || window.event;
    const element = e.target && e.target.parentNode || e.srcElement && e.srcElement.parentNode;
    if (element)
        element.className = "radioarea";
}
function addKeyhandling(inputs) {
    for (const input of inputs) {
        if (input.className === "radioctrl") {
            input.onfocus = e => radioFocus(e);
            input.onblur = e => radioBlur(e);
        }
        input.onkeydown = e => {
            const targetElement = e.target;
            if (e.keyCode == 13 && targetElement) {
                targetElement.checked = true;
                uiToModel();
                if (targetElement.name == "environmentGroup") {
                    if (targetElement.value == "local") {
                        const node = disableGroup("buildGroup");
                        if (node)
                            node.className = "formcolumn disabled";
                    }
                    else {
                        const node = enableGroup("buildGroup");
                        if (node)
                            node.className = "formcolumn";
                    }
                }
                if (targetElement.name == "environmentGroup") {
                    if (targetElement.value != "local") {
                        const node = disableGroup("localbackendGroup");
                        if (node)
                            node.className = "formcolumn disabled";
                    }
                    else {
                        const node = enableGroup("localbackendGroup");
                        if (node)
                            node.className = "formcolumn";
                    }
                }
                modelToUI();
                showUrl(buildUrl());
            }
            if (e.keyCode == 40 || e.keyCode == 38) {
                focusNextPreviousInput(e, targetElement);
            }
            if (e.keyCode == 37 || e.keyCode == 39) {
                focusNextPreviousColumn(e, targetElement);
            }
            if (e.keyCode == 461) {
                showView("maincontainer");
            }
        };
    }
}
function focusFirst() {
    const element = currentView == "maincontainer" ? document.getElementById("commitbutton") : document.getElementById("backbutton");
    if (element)
        element.focus();
}
function focusNextPreviousColumn(e, eventNode) {
    const node = findParentformcolumn(eventNode);
    let nextNode = null;
    if (node && node.className.indexOf("formcolumn") >= 0) {
        nextNode = (e.keyCode == 39) ? node.nextSibling && node.nextSibling.nextSibling : node.previousSibling && node.previousSibling.previousSibling;
        while (nextNode) {
            if (nextNode.className && nextNode.className.indexOf("formcolumn") >= 0 && nextNode.className.indexOf("disabled") == -1)
                break;
            nextNode = (e.keyCode == 39) ? nextNode.nextSibling && nextNode.nextSibling.nextSibling : nextNode.previousSibling && nextNode.previousSibling.previousSibling;
        }
        if (!nextNode) {
            nextNode = node.parentNode;
            const collection = nextNode.getElementsByClassName("formcolumn");
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
function focusNextPreviousInput(e, node) {
    let nextNode = findParentArea(node);
    if (nextNode && nextNode.className && (nextNode.className.indexOf("radioarea") >= 0 || nextNode.className.indexOf("buttonarea") >= 0)) {
        e.preventDefault();
        nextNode = (e.keyCode == 40) ? nextNode.nextSibling && nextNode.nextSibling.nextSibling : nextNode.previousSibling && nextNode.previousSibling.previousSibling;
        focusFirstInputChild(e, nextNode);
    }
}
function focusFirstInputChild(e, nextNode) {
    if (nextNode) {
        const nextInput = nextNode.querySelector("input");
        if (nextInput)
            nextInput.focus();
    }
    e.preventDefault();
    return false;
}
function findParentformcolumn(node) {
    if (node === null)
        return null;
    let parent = node.parentNode;
    while (parent) {
        if (parent.className.indexOf("formcolumn") >= 0)
            break;
        parent = parent.parentNode;
    }
    return parent;
}
function findParentArea(node) {
    if (node === null)
        return null;
    let nextNode = node.parentNode;
    while (nextNode) {
        if (nextNode.className && (nextNode.className.indexOf("radioarea") >= 0 || nextNode.className.indexOf("buttonarea") >= 0))
            break;
        nextNode = nextNode.parentNode;
    }
    return nextNode;
}
function getUrlParameter(name) {
    name = name.replace(/[\[]/, "\\[").replace(/[\]]/, "\\]");
    const regex = new RegExp("[\\?&]" + name + "=([^&#]*)");
    const results = regex.exec(location.search);
    return results === null ? "" : decodeURIComponent(results[1].replace(/\+/g, " "));
}
function setTmwVersion() {
    const zacMockSystem = {
        GetSystemInformation: () => ({ SwProductVariant: "SwProductVariant Test" })
    };
    const objZacSystem = (document.getElementById("zac") || {}).System || zacMockSystem;
    const objSysInfo = objZacSystem.GetSystemInformation();
    const elementTmw = document.getElementById("tmw");
    if (elementTmw)
        elementTmw.innerHTML = objSysInfo.SwProductVariant;
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
//# sourceMappingURL=script.js.map