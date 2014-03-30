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
