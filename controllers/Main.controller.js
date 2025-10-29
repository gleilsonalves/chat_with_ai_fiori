sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/ui/model/json/JSONModel",
    "sap/m/MessageBox",
    "sap/m/MessageToast",
    "com/sap/chatai/model/formatter"
], function (Controller, JSONModel, MessageBox, MessageToast, formatter) {
    "use strict";

    return Controller.extend("com.sap.chatai.controller.Main", {
        
        formatter: formatter,

        onInit: function () {
            // Modelo local para controle da view
            var oViewModel = new JSONModel({
                currentConversationId: null,
                messageText: "",
                isLoading: false
            });
            this.getView().setModel(oViewModel, "view");

            // Refresh automático da lista
            this._refreshMessages();
        },

        onNewChat: function () {
            var oViewModel = this.getView().getModel("view");
            var sNewConversationId = this._generateUUID();
            
            oViewModel.setProperty("/currentConversationId", sNewConversationId);
            oViewModel.setProperty("/messageText", "");
            
            MessageToast.show(this.getView().getModel("i18n").getResourceBundle().getText("newChatStarted"));
        },

        onConversationSelect: function (oEvent) {
            var oItem = oEvent.getParameter("listItem");
            var oContext = oItem.getBindingContext();
            var sConversationId = oContext.getProperty("conversation_id");
            
            var oViewModel = this.getView().getModel("view");
            oViewModel.setProperty("/currentConversationId", sConversationId);
            
            // Rolar para o final das mensagens
            this._scrollToBottom();
        },

        onBackToConversations: function () {
            var oViewModel = this.getView().getModel("view");
            oViewModel.setProperty("/currentConversationId", null);
            oViewModel.setProperty("/messageText", "");
            
            // Refresh da lista de conversas
            this._refreshMessages();
        },

        onDeleteConversation: function () {
            var that = this;
            var oViewModel = this.getView().getModel("view");
            var sConversationId = oViewModel.getProperty("/currentConversationId");
            var oModel = this.getView().getModel();
            var oResourceBundle = this.getView().getModel("i18n").getResourceBundle();

            MessageBox.confirm(
                oResourceBundle.getText("confirmDelete"),
                {
                    onClose: function (sAction) {
                        if (sAction === MessageBox.Action.OK) {
                            // Buscar todas as mensagens da conversa
                            var oListBinding = oModel.bindList("/ChatHistory", undefined, undefined, 
                                new sap.ui.model.Filter("conversation_id", sap.ui.model.FilterOperator.EQ, sConversationId));
                            
                            oListBinding.requestContexts(0, Infinity).then(function (aContexts) {
                                // Deletar cada mensagem
                                aContexts.forEach(function (oContext) {
                                    oContext.delete("$auto");
                                });
                                
                                // Voltar para lista de conversas
                                oViewModel.setProperty("/currentConversationId", null);
                                MessageToast.show(oResourceBundle.getText("conversationDeleted"));
                                
                                that._refreshMessages();
                            });
                        }
                    }
                }
            );
        },

        onSendMessage: function () {
            var oViewModel = this.getView().getModel("view");
            var sMessage = oViewModel.getProperty("/messageText");
            var sConversationId = oViewModel.getProperty("/currentConversationId");

            if (!sMessage || sMessage.trim() === "") {
                return;
            }

            // Se não há conversa ativa, criar uma nova
            if (!sConversationId) {
                sConversationId = this._generateUUID();
                oViewModel.setProperty("/currentConversationId", sConversationId);
            }

            oViewModel.setProperty("/isLoading", true);
            oViewModel.setProperty("/messageText", "");

            this._sendMessageToAI(sConversationId, sMessage);
        },

        onMessageChange: function (oEvent) {
            // Permitir Enter para enviar, Shift+Enter para nova linha
            var oTextArea = oEvent.getSource();
            if (oEvent.getParameter("value")) {
                // Lógica adicional se necessário
            }
        },

        _sendMessageToAI: function (sConversationId, sMessage) {
            var that = this;
            var oModel = this.getView().getModel();
            var oResourceBundle = this.getView().getModel("i18n").getResourceBundle();
            var oViewModel = this.getView().getModel("view");

            // Criar um contexto transitório para a action
            var oListBinding = oModel.bindList("/ChatHistory");
            var oContext = oListBinding.create({
                conversation_id: sConversationId,
                sender_type: "USER",
                message_text: sMessage
            });

            // Executar a action sendMessage
            oContext.created().then(function () {
                // Agora executar a action
                var oOperation = oModel.bindContext("com.sap.z_chat_service.sendMessage(...)", oContext);
                oOperation.setParameter("conversation_id", sConversationId);
                oOperation.setParameter("message_text", sMessage);

                oOperation.execute().then(function () {
                    MessageToast.show(oResourceBundle.getText("messageSent"));
                    oViewModel.setProperty("/isLoading", false);
                    
                    // Refresh das mensagens
                    that._refreshMessages();
                    that._scrollToBottom();
                    
                }).catch(function (oError) {
                    MessageBox.error(oResourceBundle.getText("errorSending") + ": " + oError.message);
                    oViewModel.setProperty("/isLoading", false);
                });
                
            }).catch(function (oError) {
                MessageBox.error(oResourceBundle.getText("errorCreating") + ": " + oError.message);
                oViewModel.setProperty("/isLoading", false);
            });
        },

        _refreshMessages: function () {
            var oModel = this.getView().getModel();
            if (oModel) {
                oModel.refresh();
            }
        },

        _scrollToBottom: function () {
            setTimeout(function () {
                var oScrollContainer = this.byId("messagesContainer");
                if (oScrollContainer) {
                    oScrollContainer.scrollTo(0, 99999);
                }
            }.bind(this), 100);
        },

        _generateUUID: function () {
            // Gerar UUID simples (para uso no frontend)
            return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
                var r = Math.random() * 16 | 0,
                    v = c === 'x' ? r : (r & 0x3 | 0x8);
                return v.toString(16);
            });
        }
    });
});