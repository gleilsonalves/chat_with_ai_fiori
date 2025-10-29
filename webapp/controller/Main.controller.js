sap.ui.define(
  [
    "sap/ui/core/mvc/Controller",
    "sap/ui/model/json/JSONModel",
    "sap/m/MessageToast",
    "sap/m/MessageBox",
    "sap/ui/model/Filter",
    "sap/ui/model/FilterOperator",
  ],
  function (
    Controller,
    JSONModel,
    MessageToast,
    MessageBox,
    Filter,
    FilterOperator
  ) {
    "use strict";

    return Controller.extend("com.sap.chatai.controller.Main", {
      onInit: function () {
        var oViewModel = new JSONModel({
          currentConversationId: null,
          messageText: "",
          isLoading: false,
          messages: [],
          messageCounter: 1,
        });
        this.getView().setModel(oViewModel, "view");

        var oModel = this.getOwnerComponent().getModel();
        this.getView().setModel(oModel);
      },

      onNewChat: function () {
        var oViewModel = this.getView().getModel("view");
        var sNewConversationId = this._generateUUID();

        oViewModel.setProperty("/currentConversationId", sNewConversationId);
        oViewModel.setProperty("/messageText", "");
        oViewModel.setProperty("/messages", []);
        oViewModel.setProperty("/messageCounter", 1);

        MessageToast.show("Nova conversa iniciada!");
      },

      onBackToConversations: function () {
        var oViewModel = this.getView().getModel("view");
        oViewModel.setProperty("/currentConversationId", null);
        oViewModel.setProperty("/messageText", "");
        oViewModel.setProperty("/messages", []);
        oViewModel.setProperty("/messageCounter", 1);
      },

      onDeleteConversation: function () {
        var that = this;
        MessageBox.confirm("Tem certeza que deseja excluir esta conversa?", {
          onClose: function (sAction) {
            if (sAction === MessageBox.Action.OK) {
              MessageToast.show("Conversa excluída!");
              that.onBackToConversations();
            }
          },
        });
      },

      onSendMessage: function () {
        var oViewModel = this.getView().getModel("view");
        var oModel = this.getView().getModel();
        var sMessage = oViewModel.getProperty("/messageText");
        var sConversationId = oViewModel.getProperty("/currentConversationId");

        if (!sMessage || sMessage.trim() === "") {
          return;
        }

        if (!sConversationId) {
          sConversationId = this._generateUUID();
          oViewModel.setProperty("/currentConversationId", sConversationId);
        }

        oViewModel.setProperty("/isLoading", true);
        var sMessageText = sMessage;
        oViewModel.setProperty("/messageText", "");

        var that = this;
        var oListBinding = oModel.bindList("/ChatHistory");

        // Gerar IDs únicos no formato correto
        var sUserChatUuid = this._generateUUID();
        var nMessageId = oViewModel.getProperty("/messageCounter");
        var sMessageId = nMessageId.toString().padStart(10, "0");

        // Incrementar contador
        oViewModel.setProperty("/messageCounter", nMessageId + 1);

        console.log("Enviando mensagem...");
        console.log("UUID:", sUserChatUuid);
        console.log("Message ID:", sMessageId);
        console.log("Conversation ID:", sConversationId);

        // Criar mensagem do usuário
        var oUserContext = oListBinding.create({
          chat_uuid: sUserChatUuid,
          message_id: sMessageId,
          conversation_id: sConversationId,
          sender_type: "USER",
          message_text: sMessageText,
        });

        oUserContext
          .created()
          .then(function () {
            console.log("✅ Mensagem do usuário salva!");

            // Adicionar à view
            var aMessages = oViewModel.getProperty("/messages") || [];
            aMessages.push({
              sender_type: "USER",
              message_text: sMessageText,
              timestamp: new Date().toLocaleTimeString(),
            });
            oViewModel.setProperty("/messages", aMessages);
            that._scrollToBottom();

            // Criar resposta da IA
            setTimeout(function () {
              that._createAIResponse(sConversationId, sMessageText);
            }, 1000);
          })
          .catch(function (oError) {
            console.error("❌ Erro ao salvar mensagem:", oError);
            MessageBox.error(
              "Erro ao enviar mensagem: " +
                (oError.message || "Erro desconhecido")
            );
            oViewModel.setProperty("/isLoading", false);
          });
      },

      _createAIResponse: function (sConversationId, sUserMessage) {
        var oModel = this.getView().getModel();
        var oViewModel = this.getView().getModel("view");
        var oListBinding = oModel.bindList("/ChatHistory");

        // Gerar IDs únicos
        var sAIChatUuid = this._generateUUID();
        var nMessageId = oViewModel.getProperty("/messageCounter");
        var sMessageId = nMessageId.toString().padStart(10, "0");

        oViewModel.setProperty("/messageCounter", nMessageId + 1);

        var sAIResponse = this._generateAIResponse(sUserMessage);

        console.log("Criando resposta IA...");
        console.log("UUID:", sAIChatUuid);
        console.log("Message ID:", sMessageId);

        var oAIContext = oListBinding.create({
          chat_uuid: sAIChatUuid,
          message_id: sMessageId,
          conversation_id: sConversationId,
          sender_type: "AI",
          message_text: sAIResponse,
        });

        oAIContext
          .created()
          .then(function () {
            console.log("✅ Resposta da IA salva!");

            var aMessages = oViewModel.getProperty("/messages") || [];
            aMessages.push({
              sender_type: "AI",
              message_text: sAIResponse,
              timestamp: new Date().toLocaleTimeString(),
            });
            oViewModel.setProperty("/messages", aMessages);
            that._scrollToBottom();
            oViewModel.setProperty("/isLoading", false);

            MessageToast.show("✅ Resposta recebida!");
          })
          .catch(function (oError) {
            console.error("❌ Erro ao salvar resposta:", oError);
            MessageBox.error(
              "Erro ao gerar resposta: " +
                (oError.message || "Erro desconhecido")
            );
            oViewModel.setProperty("/isLoading", false);
          });
      },

      _generateAIResponse: function (sUserMessage) {
        var aResponses = [
          "Entendo sua pergunta sobre '" +
            sUserMessage +
            "'. Como posso ajudar mais?",
          "Interessante! Você mencionou: " +
            sUserMessage +
            ". Vamos explorar isso.",
          "Recebi sua mensagem! Quando a integração com Gemini estiver ativa, terei respostas ainda melhores.",
          "Ótima pergunta! Configure a API do Gemini no backend SAP para respostas reais.",
          "Estou aqui para ajudar! Em breve com respostas alimentadas por IA Gemini.",
        ];

        var nRandom = Math.floor(Math.random() * aResponses.length);
        return aResponses[nRandom];
      },

      _generateUUID: function () {
        // Formato: xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx
        return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx"
          .replace(/[xy]/g, function (c) {
            var r = (Math.random() * 16) | 0;
            var v = c === "x" ? r : (r & 0x3) | 0x8;
            return v.toString(16);
          })
          .toUpperCase();
      },

      _scrollToBottom: function () {
        // Scroll para última mensagem
        setTimeout(
          function () {
            var oScrollContainer = this.byId("messagesContainer");
            if (oScrollContainer) {
              var oDomRef = oScrollContainer.getDomRef();
              if (oDomRef) {
                oDomRef.scrollTop = oDomRef.scrollHeight;
              }
            }
          }.bind(this),
          100
        );
      },
    });
  }
);
