sap.ui.define([], function () {
    "use strict";

    return {
        /**
         * Formata data para exibição curta
         * @param {string} sTimestamp - Timestamp em formato SAP
         * @returns {string} Data formatada
         */
        formatDate: function (sTimestamp) {
            if (!sTimestamp) {
                return "";
            }

            try {
                var oDate = new Date(sTimestamp);
                var oDateFormat = sap.ui.core.format.DateFormat.getDateInstance({
                    style: "short"
                });
                return oDateFormat.format(oDate);
            } catch (e) {
                return sTimestamp;
            }
        },

        /**
         * Formata data e hora para exibição
         * @param {string} sTimestamp - Timestamp em formato SAP
         * @returns {string} Data e hora formatadas
         */
        formatDateTime: function (sTimestamp) {
            if (!sTimestamp) {
                return "";
            }

            try {
                var oDate = new Date(sTimestamp);
                var oDateFormat = sap.ui.core.format.DateFormat.getDateTimeInstance({
                    style: "short"
                });
                return oDateFormat.format(oDate);
            } catch (e) {
                return sTimestamp;
            }
        },

        /**
         * Formata texto de mensagem longa
         * @param {string} sText - Texto completo
         * @returns {string} Texto truncado se necessário
         */
        formatMessagePreview: function (sText) {
            if (!sText) {
                return "";
            }

            var iMaxLength = 50;
            if (sText.length > iMaxLength) {
                return sText.substring(0, iMaxLength) + "...";
            }
            return sText;
        },

        /**
         * Formata o tipo de sender para exibição
         * @param {string} sSenderType - Tipo do sender (USER ou AI)
         * @returns {string} Nome do sender formatado
         */
        formatSenderName: function (sSenderType) {
            if (sSenderType === "USER") {
                return "Você";
            } else if (sSenderType === "AI") {
                return "Assistente IA";
            }
            return sSenderType;
        }
    };
});