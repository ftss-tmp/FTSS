/*global FTSS */

/**
 * Spinner directive
 *
 * creates the spinning animated gif for loading/updating
 */
(function () {

	"use strict";

	FTSS.ng.directive('spinner', function () {

		var spinner = '<img src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAH0AAAB9CAMAAAC4XpwXAAAAZlBMVEUAAAB0dnSEgoTU0tS0srSUkpTk4uT08vT8+vx8fnzEwsTs6uzc2tykoqS8urysqqzMysycmpyMiozs7uz09vTk5uT8/vysrqzc3ty8vry0trSMjoyEhoSUlpTU1tTExsTMzsycnpwcOW8oAAAAAXRSTlMAQObYZgAAAvBJREFUeF7t2Mey3CAQBVCaqBzmZWf//09aO1xCKujbuN7CcGc7c6aFiKq1lpaWlpaW/yFP2Rb+pU659i0FaDfPdfSQ0/WFfrT+o8YfCE+YfuTxo0b1qH5kkFc/Ano9fwyAHuPF1Ut0mqXVj4ge8y7lRTpZKS/S6buUF+nUP8v4CdJjgohfcF3ODyTVqYNxQ3K9fwXxF6qgk8bwV+Loxt3xK6Q/mHqYb3iDve68pxnmOz8A26u8nvpeX+kPtq4ZeozXa0TxBf8nsfSY1VzxzGFHqK7MKH7v31JxN4nOWJuCbKg/djOedA6/i0abfvxdlOYvjZ2k10MsKq+raRH0vElwE1Tk87paXMLjc6wzsUuLdBXg+fb5qtMiX6YP6ISXfNF2p/GkkY1JB06y9jSeSnRlwEd/g0ce010RPuXmqTFoaNKAZtnHWVchlOhdUgXS7VsKlOkFP5Sm2p54Ac61XTV9BHa3PvOPcZ2AuWZTcNN8/QtVuwTZ+X241jsHLvyfcvX0gf8Yv+Y6Cz+FTozaP0H/7Nr3evrG7/c5HSZo7Ekf+eN9RO20kMAfJgbXNV9/Rzfi+dUSWON6GA8nXAM6wfqAnOUoM0rhQ8mAvKkOxF8JGT0GefTBJvoA6R1y6xLo7az30FGq64HiA5HNHAsG8O5gK9HPvAYvTwJw9g504n+d8b5UTx69LdBPfFLBhl/L+zI98r9r6lSkR95ILq3WRHcFeuTHqAILdce9bYw62cuvO44+p7wt1Mn6PlM6UDzZrH4fx9PtBb/jeoA3hDE6gLpl6srTVRtAXXH1+ZLXL4AObIvnni6be+HqNqPzyuk3lu6sQnRDd+2DpSuomeVOXxg6fP5fVrnuYV2ts1SfvMLbvMp0PSlJW61IJ6tEzW4CXc5vXqDLeU8O1+W8coNAl/NDt+O6nO92r2Fdziuvpx7W5byaeu8AvRavvOsGDeiVeHXoYXOAHnlZbvTpaOb43OT4dFkAj1xvaWlpaWlpaZG3P1sZJAdzusKlAAAAAElFTkSuQmCC" />';
		//var spinner = 'viewBox="0 0 100 100"><path d="M84.26,48.931c0,9.579-4.205,18.617-11.535,24.797l-6.368-7.554c5.098-4.298,8.022-10.583,8.022-17.243 c0-11.979-9.399-21.775-21.206-22.471H48.34l4.07,10.304c0.137,0.345,0.025,0.739-0.271,0.962c-0.296,0.224-0.706,0.223-1-0.004 L30.9,22.161c-0.203-0.157-0.323-0.397-0.323-0.655c0-0.257,0.12-0.499,0.323-0.655L51.14,5.291c0.148-0.114,0.325-0.17,0.503-0.17 c0.176,0,0.35,0.055,0.498,0.166c0.296,0.223,0.407,0.618,0.271,0.963l-4.07,10.303l3.5,0.01v-0.052c1.251,0,2.485,0.079,3.7,0.218 c0.806,0.084,1.705,0.203,2.388,0.364C72.903,19.951,84.26,33.136,84.26,48.931z M48.86,62.279c-0.294-0.227-0.704-0.228-1-0.003 c-0.296,0.223-0.407,0.617-0.271,0.962l4.07,10.304h-4.833C35.021,72.845,25.621,63.048,25.621,51.07 c0-6.233,2.488-12.033,7.005-16.331l-6.812-7.158C19.318,33.763,15.74,42.104,15.74,51.07c0,15.794,11.356,28.98,26.332,31.838 c0.684,0.161,1.583,0.28,2.388,0.364c1.215,0.139,2.448,0.218,3.7,0.218v-0.052l3.5,0.01l-4.07,10.303 c-0.137,0.346-0.025,0.741,0.271,0.963c0.148,0.111,0.322,0.166,0.498,0.166c0.178,0,0.354-0.056,0.503-0.17L69.1,79.149 c0.203-0.156,0.323-0.398,0.323-0.655c0-0.257-0.12-0.498-0.323-0.654L48.86,62.279z"/></svg>';

		return {
			'restrict': 'E',
			'replace' : true,
			'scope'   : {},
			'link'    : function ($scope, $el, $attrs) {

				var id, classes, style;

				id = $el[0].id ? 'id="' + $el[0].id + '"' : '';
				classes = ' class="spinner ' + ($el[0].className || '') + '"';
				style = $attrs.size ? 'width:' + $attrs.size : 'width:10%;margin: 10% 40%';

				$el[0].outerHTML = '<div ' + id + classes + ' style="' + style + '">' + spinner + '</div>';

			}
		};

	});


}());
