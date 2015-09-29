/* Copyright (C) 2015 SAS Institute Inc - All Rights Reserved
 * You may use, distribute and modify this code under the
 * terms of the GPL license.
 *
 * You should have received a copy of the XYZ license with
 * this file. If not, please write to: khaled.nabli@sas.com
 */


var rtdmHost = "sasbap.demo.sas.com";
var rtdmEventName = "MobileApp_Offer_Request_Retail";
var rtdmResponseEventName = "MobileApp_Track_Response";

var indexPageUrl = "index.html";
var loginPageUrl = "login.html";
var landingPageUrl = "landing.html";


var startLinkSelektor = "#logo > a"; 
var loginLinkSelector = "#meta-nav-login";
var loginLinkHtml = "Hallo Christian";
var loginFormSelector = "#login-form";
var loginUserInputSelector = "#login-email";
var loginBtnInputSelector = "#my-account-action-login";



var nbaPlaceHolderSelectors = [	"#my-account > div.content > ul.orders-wishlist-sections.cf > ul > li > div:nth-child(2)", 
								"#my-account > div.content > ul.orders-wishlist-sections.cf > ul > li > div:nth-child(3)", 
								"#my-account > div.content > ul.orders-wishlist-sections.cf > ul > li > div:nth-child(4)"];



var nbaHtmlTemplate = "<div class='product_detail_img_container'>"
	+" <div class='product_detail_img_overlayer'>"
	+" 	<div class='product_detail_name'>"
	+" 		<h2>%OFFERNAME%</h2>"
	+" 	</div>"

	+" 	<!--product_detail_order-->"
	+" <br />"
	+"<a %INTERESTOFFER% href='http://sasbap.demo.sas.com/Saturn/images/%OFFERCODE%.jpg' data-lightbox='%OFFERCODE%' data-title='%OFFERNAME%'>"
	+"<img src='http://sasbap.demo.sas.com/Saturn/images/%OFFERCODE%.jpg' width='100%'>"
	+"</a>"
	+" 	<div class='product_detail_order clearfix'>"
	+" 		<a %ACCEPTOFFER% class=\"button gray\"><span>In den Warenkorb</span></a>	"				
	+" 	</div>"
	+" </div>"
	+"</div>";














console.log("--javascript libs loading--");

$(document).ready(function () {
	console.log("--RTDM Integration libs loaded--");
	prepareWebsite();
});



function prepareWebsite() {
	console.log("Prepare Website for Omni-Channel Demo");
	// manipulate link to start page
	if(startLinkSelektor != "") {
		console.log("Setting Link to Start Page");
			
		if(indexPageUrl != "") {
			console.log("Setting Link HREF to: " + indexPageUrl);
			$(startLinkSelektor).attr("href", indexPageUrl);
		}
	}


	// manipulate link to login page
	if(loginLinkSelector != "") {
		console.log("Setting Link to Login Page");
		if(loginLinkHtml != "") {
			console.log("Setting Link HTML to: " + loginLinkHtml);
			$(loginLinkSelector).html(loginLinkHtml);
		}
			
		if(loginPageUrl != "") {
			console.log("Setting Link HREF to: " + loginPageUrl);
			$(loginLinkSelector).attr("href", loginPageUrl);
		}
	}
	
	// manipulate form action to landing.html
	if(loginFormSelector != "") {
		console.log("Setting Action of Login Form");
		$(loginFormSelector).attr("action", landingPageUrl);
		$(loginFormSelector).attr("onsubmit", "processLoginBtnClick();");
		$(loginFormSelector).on('submit', function () { processLoginBtnClick() });
		console.log("Form Action set to: " + landingPageUrl);
	}
	
	// remove validators
	$(loginUserInputSelector).unbind();
	$(loginBtnInputSelector).unbind();
	$(loginFormSelector).unbind();

	// change user id input
	//$(loginUserInputSelector).attr("id", "surrogateUserInput");

	// manipulate login btn onclick event;
	if(loginBtnInputSelector != "") {
		$(loginBtnInputSelector).on('click', function () { processLoginBtnClick() });
	}

	// Build Offers 
	if (getCurrentFileName() == landingPageUrl) {
		buildOfferPage();
	}
}


function getCurrentFileName() {
	if(document.location.href.match(/[^\/]+$/) != null) {
		return document.location.href.match(/[^\/]+$/)[0];
	}

	return indexPageUrl;
}


/**
* 
*
*/
function processLoginBtnClick() {
	console.log("Processing Login Proccess");
	var userid = $(loginUserInputSelector).val();
	if(userid == undefined || userid == "") {
		console.log("Could not get user id. Please check the selector for input field");
		alert("Please enter a valid user identity");
		event.preventDefault();
	}

	console.log("Storing User ID: " + userid + " into local storage");
	window.localStorage.demoWebsiteUserId = userid;
	return;
}

/**
* 
*
*/
function buildOfferPage() {
	// read user id
	var userid = window.localStorage.demoWebsiteUserId;

	// request offers from rtdm
	var rtdmRequestUrl = "http://" + rtdmHost + "/RTDM/rest/runtime/decisions/" + rtdmEventName + "/";
	var contentType = 'application/vnd.sas.decision.request+json';
	var rtdmRequest = {"version" : 1, "clientTimeZone" : "EST", "inputs":{}};
	rtdmRequest.inputs.Customer_ID = parseInt(userid);
	rtdmRequest.inputs.Channel_CD = "Web";
	rtdmRequest.inputs.Event_CD = "Standard";

	//console.log("Sending Request to RTDM");
	//console.log(rtdmRequest);
	$.ajax({
		method: "POST",
		contentType: contentType,
		url: rtdmRequestUrl,
		data: JSON.stringify(rtdmRequest)
	}).done(function(rtdmResponse) { 
		// render templates
		processRtdmOffers(rtdmResponse) 
	});

	
}

/**
* 
*
*/
function processRtdmOffers(rtdmResponse){
	//console.log("Processing RTDM Response");
	//console.log(rtdmResponse);
	// for each offer cd line, create template Content: ["offerCd": "TR001", "offerNm", "My Personal Offer"]
	var countOffers = rtdmResponse.outputs["Offer_CDS"].length;
	var countPlaceholder = nbaPlaceHolderSelectors.length;
	for ( var i = 0; i < countOffers && i < countPlaceholder; i ++ ) {
		var templateContent = [];
		var templateVariable = {};
		var offerObj = {};
		offerObj.userid = rtdmResponse.outputs["Customer_ID"];
		offerObj.index = i+1;
		offerObj.code = rtdmResponse.outputs["Offer_CDS"][i];
		offerObj.name = rtdmResponse.outputs["Offer_Names"][i];
		offerObj.score = rtdmResponse.outputs["Offer_Scores"][i];
		offerObj.trackingCd = "912312";

		templateContent.push({"name": "userId", 	"value": 	offerObj.userid});
		templateContent.push({"name": "offerIndex", "value": 	i});
		templateContent.push({"name": "offerCode", 	"value": 	offerObj.code });
		templateContent.push({"name": "offerName", 	"value": 	offerObj.name });
		templateContent.push({"name": "offerScore", "value": 	offerObj.score });
		templateContent.push({"name": "acceptOffer", "value": 	renderAcceptButton(offerObj, true) });
		templateContent.push({"name": "rejectOffer", "value": 	renderRejectButton(offerObj, true) });
		templateContent.push({"name": "interestOffer", "value": renderInterestButton(offerObj, true)});

	//	console.log("Calling renderHtmlTemplate");
	//	console.log(templateContent);

		var renderedHtml = renderHtmlTemplate(nbaHtmlTemplate, templateContent);

		$(nbaPlaceHolderSelectors[i]).html(renderedHtml);
	}
}



/**
* 
*	templateContent = ["offerCd": "TR001", "offerNm", "My Personal Offer"]
*/
function renderHtmlTemplate(htmlTemplate, templateContent) {
	// for each value, search an replace in htmlTemplate like
	// value: offerCd -> template %UPCASE(offerCd)% -> %OFFERCD%
	var renderedHtml = templateContent.reduce(function(previousValue, currentValue, index, array) {
		var find = "%" + currentValue["name"].toUpperCase() + "%";
		var replaceWith = currentValue["value"];
		return replaceAll(find, replaceWith, previousValue);
	}, htmlTemplate);

	//console.log("Finishing renderHtmlTemplate");
	//console.log(renderedHtml);
	return renderedHtml;
}



function replaceAll(find, replace, str) {
  return str.replace(new RegExp(find, 'g'), replace);
}

function displayMoreDetails(elem) {
	$(elem).append();
}


function renderAcceptButton(offerObj, reloadPage) {
	return " onclick=\"rdmSendResponse('" + offerObj.userid + "','" + offerObj.index + "','" + offerObj.trackingCd +  "','" + offerObj.code + "','" + offerObj.name + "','accepted'," + reloadPage + ");\"";
}

function renderRejectButton(offerObj, reloadPage) {
	return " onclick=\"rdmSendResponse('" + offerObj.userid + "','" + offerObj.index + "','" + offerObj.trackingCd +  "','" + offerObj.code + "','" + offerObj.name + "','rejected'," + reloadPage + ");\"";
}

function renderInterestButton(offerObj, reloadPage) {
	return " onclick=\"rdmSendResponse('" + offerObj.userid + "','" + offerObj.index + "','" + offerObj.trackingCd +  "','Click','" + offerObj.name + "','Banner Click'," + reloadPage + ");\"";
}


function rdmSendResponse(custid, teaser_code, ttc, offer_code, offer_name, response, reloadPage) {
	console.log("rdmSendResponse - TTC: " + ttc + " teaser_code: " + teaser_code + " response: " + response + " custid: " + custid + " offerCode: " + offer_code + " offerName: " + offer_name);

	var rtdmRequestUrl = "http://" + rtdmHost + "/RTDM/rest/runtime/decisions/" + rtdmResponseEventName + "/";
	var contentType = 'application/vnd.sas.decision.request+json';
	var rtdmRequest = {"version" : 1, "clientTimeZone" : "EST", "inputs":{}};

	rtdmRequest.inputs.CUSTOMERID = parseInt(custid);
	rtdmRequest.inputs.CHANNEL_CD = "Web";
	rtdmRequest.inputs.OFFER_CD = offer_code;
	rtdmRequest.inputs.TEASER_CD = teaser_code;
	rtdmRequest.inputs.OFFER_TRACKING_CD = ttc;
	rtdmRequest.inputs.RESPONSE_CD = response;
	rtdmRequest.inputs.OFFER_MEDIUM = offer_name;


	$.ajax({
		method: "POST",
		contentType: contentType,
		url: rtdmRequestUrl,
		data: JSON.stringify(rtdmRequest)
	}).done(function(rtdmResponse) { 
		// render templates
		//processRtdmOffers(rtdmResponse)
		if(reloadPage)
			buildOfferPage();
	});
}