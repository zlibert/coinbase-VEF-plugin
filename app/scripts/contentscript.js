'use strict';

if (document.URL.includes("coinbase.com/send")) {

	function round2f(num) {
		var scale=2;
	  	if(!("" + num).includes("e")) {
	    	return +(Math.round(num + "e+" + scale)  + "e-" + scale);  
	  	} 
	  	else {
	    	var arr = ("" + num).split("e");
	    	var sig = ""
	    	if(+arr[1] + scale > 0) {
	      		sig = "+";
	    	}
	    
	    	return +(Math.round(+arr[0] + "e" + sig + (+arr[1] + scale)) + "e-" + scale);
	  	}
	}

	var btcChanged=false;
	var vefChanged=false;
	window.addEventListener("load", function () {
		var app = angular.module('btcven-extension', []);
		//Add angular to webpage
		var html = document.querySelector('html');
		html.setAttribute('ng-app', '');
		html.setAttribute('ng-csp', '');

		//Identify wether it's  .  or  ,  the decimal separator symbol
		if (typeof decimalSeparator === 'undefined'){ // execute only at first time
			if (document.getElementById("send_funds_amount").placeholder.includes(',')) {
				var decimalSeparator= ',';
				//console.log("decimalSeparator = ,");
			}else{
				if (document.getElementById("send_funds_amount").placeholder.includes('.')){
					var decimalSeparator= '.';
					//console.log("decimalSeparator = .");
				}
				else{
					console.log("Error detecting decimal separator configuration");
				}
			}
		}
		// adding angular to send funds form
		var send_funds_form = document.getElementById('send_funds_form');
		send_funds_form.setAttribute('ng-controller', 'MainController');
		app.controller('MainController', function ($scope) {});

		var myDirective = document.createElement('div');
		myDirective.setAttribute('my-directive', '');
		document.querySelector('.glodal__input__wrapper').appendChild(myDirective);
		// adding VEF field
		var parentGuest = document.getElementsByClassName("glodal__input--amount")[0];
		var childGuest = document.createElement('div');
		childGuest.id= 'equivalencia-vef';
		childGuest.className= 'glodal__input--amount';
		if (decimalSeparator==','){
			childGuest.innerHTML = '<div class="glodal__input--amount"><input id="vef-equivalent-amount" placeholder="0,00" tabindex="2" type="text" name="vef-transaction[amount]"><input value="VEF" type="hidden" name="vef-transaction[currency]" id="vef-transaction_currency" autocomplete="off"><div class="add-on currency">VEF</div><div class="currency-dropdown hidden"></div></div>';
		}
		else{
			childGuest.innerHTML = '<div class="glodal__input--amount"><input id="vef-equivalent-amount" placeholder="0.00" tabindex="2" type="text" name="vef-transaction[amount]"><input value="VEF" type="hidden" name="vef-transaction[currency]" id="vef-transaction_currency" autocomplete="off"><div class="add-on currency">VEF</div><div class="currency-dropdown hidden"></div></div>';
		}
		
		parentGuest.parentNode.insertBefore(childGuest, parentGuest.nextSibling);
		

		// splitting Wallet balance into amount and currency
		var walletAmount = document.getElementsByClassName("balance")[0].innerHTML.split(" ")[0];
		//if comma is decimal separator, transfor to dot to get math operations right
		if (decimalSeparator == ',') {
			walletAmount= walletAmount.replace(",",".");
		}
		var walletCurrency = document.getElementsByClassName("balance")[0].innerHTML.split(" ")[1];
		var btcvef= 0;
		var usdvef= 0;


		app.directive('myDirective', ['$http', function($http, $scope) {

			//Get BTC-VEF rate
			//http://api.bitcoinvenezuela.com/?rates=yes
			// separate with thousands with dots
			$http({method: 'GET', url:'https://api.bitcoinvenezuela.com' }).then(
				function (result) {

	                           btcvef= result.data.BTC.VEF;
	                           usdvef= btcvef / result.data.BTC.USD;
	                           console.log("BTC/VEF = " + btcvef + " , USD/VEF = " + usdvef);
	                           if (walletCurrency == 'BTC'){
									var vefAmount = walletAmount * btcvef;
									vefAmount = round2f(vefAmount).toFixed(2)
									if (decimalSeparator==','){
										vefAmount= Number(vefAmount).toLocaleString();
										document.getElementById("vef-balance").innerHTML=  vefAmount + ' VEF';
									}else{
										if (decimalSeparator=='.'){
											vefAmount = round2f(vefAmount).toFixed(2);
											document.getElementById("vef-balance").innerHTML=  vefAmount + ' VEF';
										}
									}
								}else{
									if (walletCurrency == 'USD'){
										walletAmount = walletAmount * usdvef;
									}
									else{
										console.log("Currency not supported by plugin");
									}
								}
	            }, 
	            function (error) {
	                console.log("Error: No data returned from bitcoinvenezuela API");
	            }
	        );

			// ---- Simple JS Binding between BTC <-> VEF fields -----
			function MyCtor(element, data) {
			    this.data = data;
			    this.element = element;
			    element.value = data;
			    element.addEventListener("change", this, false);
			}
			var btcObj = new MyCtor(document.getElementById("send_funds_amount"), document.getElementById("send_funds_amount").value); 		//btc
			var vefObj = new MyCtor(document.getElementById("vef-equivalent-amount"), document.getElementById("vef-equivalent-amount").value);	//vef new field

			MyCtor.prototype.handleEvent = function (event) {

			    switch (event.type) {
			        case "change":
			        	// if sending amount introduced was in btc field
			        	if (this.element.id=="send_funds_amount"){
			        		btcChanged= true;
			        	}else
			        	{ //if sending amount introduced was in vef filed
			        		if (this.element.id=="vef-equivalent-amount"){
			        			vefChanged= true;
			        		}
			        	}
			       		
			       		if (decimalSeparator==','){
			       			
			       			if ((this.element.value.includes(',') && Number(this.element.value.split(",")[0])==0 && Number(this.element.value.split(",")[1])==0) || this.element.value=="0")
			       			{ //value = 0 with comma separator
			       				console.log("zero introduced and comma separator");
			       				vefObj.change("0,00");
			       				btcObj.change("0,00");
			       				vefChanged=false;
			       				btcChanged=false;

			       			}
			       			else
			       			{
			       				console.log("comma and > zero");
			       			 //value > 0  and  comma separator
		       					//temp saving to replace comma  by  dot  and do the math
		       					if (btcChanged){
			       					var tempAmount= this.element.value;
					        		tempAmount= (tempAmount.replace(",",".") * btcvef).toFixed(2).replace(".",",");
					        		//console.log(tempAmount);
					        		vefObj.change(tempAmount);
					        		vefChanged=false;
					        		btcChanged=false;
				        		}
				        		else{
				        			if (vefChanged){
				        				var tempAmount= this.element.value;
						        		tempAmount= (tempAmount.replace(",",".") / btcvef).toFixed(8).replace(".",",");
						        		// reversing  comma to dot separator
						        		btcObj.change(tempAmount);
						        		vefChanged=false;
					        			btcChanged=false;
				        			}
				        		}
			       			}
			       		}

			       		else{ //if separator is  dot
			       			if (decimalSeparator=='.' && this.element.value==0){
			       				//console.log("decimal separator dot and value 0");
			       				if (this.element.value==0){
			       					vefObj.change(0);
					    			btcObj.change(0);
					    			vefChanged=false;
					        		btcChanged=false;
					    		}
			       			}
			       			else
			       			{
					    		//console.log("decimal separator dot and value diff than 0 + " + this.element.value);
					    		if (btcChanged){
					    			vefObj.change((this.element.value * btcvef).toFixed(2));
					    			vefChanged=false;
					        		btcChanged=false;
					    		}
					    		else{
					    			//console.log("decimal separator dot and value diff than 0 + " + this.element.value);
					    			if (vefChanged){
					    				btcObj.change((this.element.value / btcvef).toFixed(8));
					    				vefChanged=false;
					        			btcChanged=false;
					    			}
					    		}
					    	}
			       		}
			    }
			};

			MyCtor.prototype.change = function (value) {
			    this.data = value;
			    this.element.value = value;
			};
			// ---- end Binding ---------------------------------

			var templateVar = '<div class="glodal__input--account">    <div class="base-select-container accounts">        <a href="" class="selector" data-type="coinbase-crypto-account" data-currency="VEF"> <span class="name">Saldo en Bolívares: </span> <span id="vef-balance" style="float: right;">' + 'cargando...' + '</span> </a>        <ul style="display: none;">        </ul>    </div></div>';
			return {
				restrict: 'EA',
				replace: true,
				template: templateVar
				//'<div class="glodal__input--amount"><input id="vef_amount" placeholder="0.00" tabindex="2" type="text" name="transaction[vef_amount]"><input value="VEF" type="hidden" name="transaction[currency]" id="vef_currency" autocomplete="off"><div class="add-on currency">VEF</div><div class="currency-dropdown hidden"></div></div>'
			};
		}]); //end directive myDirective
		
		// When confirmation button gets clicked, it should modify the confirmation-message
		/*var sendFunds = document.getElementById("send_funds_next");
		console.log("sendFunds : " + sendFunds.parentElement.parentElement.nodeName);
		sendFunds.parentElement.parentElement.setAttribute("ng-app","confirmApp");
		sendFunds.parentElement.setAttribute("ng-controller","modifyConfirmation");
		//sendFunds.setAttribute("ng-click", "addVEF()");
		//sendFunds.onclick = addVEF();
		
		var modApp= angular.module('confirmApp', [])
			.controller('modifyConfirmation', function($scope) {
		    			// TO FIX:  AFTER CLICKING SEND FORM MODIFICATIONS ARE LOST
				$scope.addVEF= function(){
					var message= document.getElementsByClassName("confirmation-message")[0];
			    	console.log("message: " + message.innerHTML());
					console.log("button pressed: " + document.getElementsByClassName("glodal__summary")[0]);
					var summaryElement= document.getElementsByClassName("glodal__summary")[0];
					var vefSummary= document.createElement('div');
					vefSummary.innerHTML= '<div class="glodal__summary__item">          <div class="summary-title">Amount</div>          <div class="summary-info">            <div class="title-primary">' + vefObj.element.value + ' VEF            </div>          </div>        </div>';
					vefSummary.className= 'glodal__summary__item';
					//summaryElement.appendChild(vefSummary);
				}
			}
		);
		*/
		angular.bootstrap(html, ['btcven-extension'], []);
	});
}
else{
	if (document.URL.includes("coinbase.com/dashboard")){
		window.addEventListener("load", function (){
			function round2f(num) {
				var scale=2;
			  	if(!("" + num).includes("e")) {
			    	return +(Math.round(num + "e+" + scale)  + "e-" + scale);  
			  	} 
			  	else {
			    	var arr = ("" + num).split("e");
			    	var sig = ""
			    	if(+arr[1] + scale > 0) {
			      		sig = "+";
			    	}
			    
			    	return +(Math.round(+arr[0] + "e" + sig + (+arr[1] + scale)) + "e-" + scale);
			  	}
			}

			var divVEF= document.createElement("div");
			var vefPriceSpan= document.createElement("span");
			vefPriceSpan.id= "vefPrice";
			vefPriceSpan.style.fontSize = "40px";
			vefPriceSpan.style.color="#5c6878";
			vefPriceSpan.innerHTML = "Cargando tasa VEF..."
			divVEF.style.marginLeft = "25px";
			divVEF.appendChild(vefPriceSpan);
			
			var layoutContainer= document.getElementsByClassName("Layout__contentContainer___10jlo Layout__isSidebarExpanded___3nBIy")[0];
			layoutContainer.insertBefore(divVEF, layoutContainer.firstChild);
			var app = angular.module('btcven-extension', []);
			//Add angular to webpage
			var html = document.querySelector('html');
			html.setAttribute('ng-app', '');
			html.setAttribute('ng-csp', '');
			
			//var bigAmount= document.getElementsByClassName("Flex Header__headerContainer___2ZS8V")[0];
			var bigAmount= document.getElementById("root");
			bigAmount.setAttribute('ng-controller', 'MainController');
			app.controller('MainController', function ($scope) {});

			var myDirective = document.createElement('div');
			myDirective.setAttribute('my-directive', '');
			document.getElementById('root').appendChild(myDirective);

			app.directive('myDirective', ['$http', function($http, $scope) {
				var btcvef = 0;
				var usdvef = 0;
				$http({method: 'GET', url:'https://api.bitcoinvenezuela.com/' }).then(
					function (result) {
                        btcvef= result.data.BTC.VEF;
                        usdvef= btcvef / result.data.BTC.USD;
                        vefAmount = round2f(btcvef).toFixed(2)
                        console.log("BTC/VEF = " + btcvef + " , USD/VEF = " + usdvef);
                        var vefAmount= Number(vefAmount).toLocaleString();
                        vefPriceSpan.innerHTML= vefAmount;
                        var vef= document.createElement("span");
                        vef.id= "vef-letters";
                        vef.style.fontSize = "26px";
                        vef.style.color="#5c6878";
                        vef.style.marginLeft = "15px";
                        vef.innerHTML= "VEF/BTC";
                        divVEF.appendChild(vef);
		            }, 
		            function (error) {
		                console.log("Error: No data returned from bitcoinvenezuela API");
		            }
		        );
		        return {

		        };
			}]);
			angular.bootstrap(html, ['btcven-extension'], []);
		});
	}
}
