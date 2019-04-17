/*
Copyright (C) 2017-2019  Barry de Graaff

This program is free software: you can redistribute it and/or modify
it under the terms of the GNU General Public License as published by
the Free Software Foundation, either version 3 of the License, or
(at your option) any later version.

This program is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
GNU General Public License for more details.

You should have received a copy of the GNU General Public License
along with this program.  If not, see http://www.gnu.org/licenses/.
*/

function tk_barrydegraaff_reply_by_filter_HandlerObject() {
   tk_barrydegraaff_reply_by_filter_HandlerObject.settings = {};
};

tk_barrydegraaff_reply_by_filter_HandlerObject.prototype = new ZmZimletBase();
tk_barrydegraaff_reply_by_filter_HandlerObject.prototype.constructor = tk_barrydegraaff_reply_by_filter_HandlerObject;
var ReplyFilterZimlet = tk_barrydegraaff_reply_by_filter_HandlerObject;

ReplyFilterZimlet.prototype.init = function()
{
      AjxPackage.require({
        name: 'Preferences',
        callback: new AjxCallback(this, this.overrides)
      });
};      
      
ReplyFilterZimlet.prototype.overrides = function() {

   ZmFilterRuleDialog.prototype.popup =
   function(rule, editMode, referenceRule, accountName, outgoing) {
      // always make sure we have the right rules container in case of multi-mbox
      this._rules = AjxDispatcher.run(outgoing ? "GetOutgoingFilterRules" : "GetFilterRules", accountName);
      this._outgoing = outgoing;
      this._rules.loadRules(); // make sure rules are loaded (for when we save)
      this._inputs = {};
      this._rule = rule || ZmFilterRule.getDummyRule();
      this._editMode = editMode;
      this._referenceRule = referenceRule;
      this.setTitle(editMode ? ZmMsg.editFilter : ZmMsg.addFilter);
   
      var nameField = Dwt.byId(this._nameInputId);
      var name = rule ? rule.name : null;
      nameField.value = name || "";
   
      var activeField = Dwt.byId(this._activeCheckboxId);
      activeField.checked = (!rule || rule.active);
      Dwt.setHandler(activeField, DwtEvent.ONCHANGE, AjxCallback.simpleClosure(this._activeChangeListener, this));
   
      var stopField = Dwt.byId(this._stopCheckboxId);
      stopField.checked = (!editMode);
   
      var checkAll = (rule && (rule.getGroupOp() == ZmFilterRule.GROUP_ALL));
      this._conditionSelect.setSelectedValue(checkAll ? ZmFilterRule.GROUP_ALL : ZmFilterRule.GROUP_ANY);
   
      this._conditionsTabGroup.removeAllMembers();
      this._actionsTabGroup.removeAllMembers();
   
      this._renderTable(this._rule, true, this._conditionsTableId, this._rule.conditions, this._conditionsTabGroup);	// conditions
      this._renderTable(this._rule, false, this._actionsTableId, this._rule.actions, this._actionsTabGroup);	// actions
      this._addDwtObjects();
   
      DwtDialog.prototype.popup.call(this);
   
         // begin zimlet hook         
         if(!document.getElementById('ReplyFilterZimlet'))
         {
            if(!appCtxt.getFilterRuleDialog().isEditMode())
            {
            document.getElementById('ZmFilterRuleDialog_stop_control').insertAdjacentHTML('beforebegin',"<button class='ZButtonBorder' style='height:25px;margin-left:13px' id='ReplyFilterZimlet' onclick=\"#\">"+ZmMsg.add+": "+ZmMsg.replyByEmail+"</button><br><br>");
   
            var zimletInstance = appCtxt._zimletMgr.getZimletByName('tk_barrydegraaff_reply_by_filter').handlerObject;
            var ReplyFilterZimlet = document.getElementById("ReplyFilterZimlet");
               ReplyFilterZimlet.onclick = AjxCallback.simpleClosure(zimletInstance.inputReplyText);
            }   
         } 
         
         if(appCtxt.getFilterRuleDialog().isEditMode())
         {
            try{
               var element = document.getElementById("ReplyFilterZimlet");
               element.parentNode.removeChild(element);
            } catch(err){}   
         }
         // end zimlet hook
   
      nameField.focus();
   };
   
   ZmFilterRuleDialog.prototype._okButtonListener =
   function(ev) {
   
      var rule = this._rule;
      var msg = null;
      var name = Dwt.byId(this._nameInputId).value;
      name = name.replace (/\s*$/,'');
      name = name.replace (/^\s*/,'');
      if (!name) {
         msg = ZmMsg.filterErrorNoName;
      }
   
      var rule1 = this._rules.getRuleByName(name);
      if ( rule1 && (rule1 != rule))  {
         msg = ZmMsg.filterErrorNameExists;
      }
      if (msg) {
         var msgDialog = appCtxt.getMsgDialog();
         msgDialog.setMessage(msg, DwtMessageDialog.CRITICAL_STYLE);
         msgDialog.popup();
         return;
      }
   
      var active = Dwt.byId(this._activeCheckboxId).checked;
      var anyAll = this._conditionSelect.getValue();
   
      // adding a rule always starts with dummy
   
      if (this._editMode) {
         var cachedRule = {
            name: rule.name,
            active: rule.active,
            conditions: rule.conditions,
            actions: rule.actions
         };
   
         rule.name = name;
         rule.active = active;
         rule.clearConditions();
         rule.clearActions();
      } else {
         rule = new ZmFilterRule(name, active);
      }
      rule.setGroupOp(anyAll);
   
      // get input from tables so order is preserved
      var table = Dwt.byId(this._conditionsTableId);
      var rows = table.rows;
      for (var i = 0; i < rows.length; i++) {
         var c = this._getConditionFromRow(rows[i].id);
         if (msg = this._checkCondition(c)) {
            break;
         } else {
            rule.addCondition(c.testType, c.comparator, c.value, c.subjectMod, c.caseSensitive);
         }
      }
      if (!msg) {
         table = Dwt.byId(this._actionsTableId);
         rows = table.rows;
         for (var i = 0; i < rows.length; i++) {
            var action = this._getActionFromRow(rows[i].id);
            if (msg = this._checkAction(action)) {
               break;
            }
            rule.addAction(action.actionType, action.value);
         }
      }
   
      if (msg) {
         // bug #35912 - restore values from cached rule
         if (cachedRule) {
            rule.name = cachedRule.name;
            rule.active = cachedRule.active;
            rule.conditions = cachedRule.conditions;
            rule.actions = cachedRule.actions;
         }
   
         var msgDialog = appCtxt.getMsgDialog();
         msgDialog.setMessage(msg, DwtMessageDialog.CRITICAL_STYLE);
         msgDialog.popup();
         return;
      }
   
   
       /* Zimlet hook here **/
   
         var zimletInstance = appCtxt._zimletMgr.getZimletByName('tk_barrydegraaff_reply_by_filter').handlerObject;
         try {
            if(typeof zimletInstance.replyBody != "undefined")
            {
               if(zimletInstance.replyBody != "")
               {            
                  rule.addAction(ZmFilterRule.A_REPLY);                             
                  rule.actions.actionReply = [];
                  
                  var replyAction = {};
                  replyAction['content'] = zimletInstance.replyBody;
                  
                  rule.actions.actionReply.push(replyAction);
                  zimletInstance.replyBody = "";
              }   
            }
         } catch(err){}
   
       /* End Zimlet hook **/
   
      var stopAction = Dwt.byId(this._stopCheckboxId).checked;
      if (stopAction) {
         rule.addAction(ZmFilterRule.A_STOP);
      }
   
      var respCallback = new AjxCallback(this, this._handleResponseOkButtonListener);
      if (this._editMode) {
         this._rules._saveRules(this._rules.getIndexOfRule(rule), true, respCallback);
      } else {
         this._rules.addRule(rule, this._referenceRule, respCallback);
      }
   };
   
};


/* status method show a Zimbra status message
* */
ReplyFilterZimlet.prototype.status = function(text, type) {
   var transitions = [ ZmToast.FADE_IN, ZmToast.PAUSE, ZmToast.FADE_OUT ];
   appCtxt.getAppController().setStatusMsg(text, type, null, transitions);
}; 

ReplyFilterZimlet.prototype._cancelBtn =
function() {
   var zimletInstance = appCtxt._zimletMgr.getZimletByName('tk_barrydegraaff_reply_by_filter').handlerObject;
   
   try{
      zimletInstance._dialog.setContent('');
      zimletInstance._dialog.popdown();
   }
   catch (err) {}
};

ReplyFilterZimlet.prototype.inputReplyText = function(rule)
{
   var zimletInstance = appCtxt._zimletMgr.getZimletByName('tk_barrydegraaff_reply_by_filter').handlerObject;
   zimletInstance._dialog = new ZmDialog( { title:ZmMsg.composeBody, parent:zimletInstance.getShell(), standardButtons:[DwtDialog.OK_BUTTON,DwtDialog.CANCEL_BUTTON], disposeOnPopDown:true } );   
   
   zimletInstance._dialog.setContent(
   '<div style="width:500px; height:350px;">'+
   '<div class="DwtInputField"><textarea rows="22" style="width:98%" id="ReplyFilterZimletBody" placeholder="'+ZmMsg.composeBody+'"></textarea></div>' +
   '</div>'
   );
   
   zimletInstance._dialog.setButtonListener(DwtDialog.OK_BUTTON, new AjxListener(zimletInstance, zimletInstance.setReplyBody));
   zimletInstance._dialog.setButtonListener(DwtDialog.CANCEL_BUTTON, new AjxListener(zimletInstance, zimletInstance._cancelBtn));
   document.getElementById(zimletInstance._dialog.__internalId+'_handle').style.backgroundColor = '#eeeeee';
   document.getElementById(zimletInstance._dialog.__internalId+'_title').style.textAlign = 'center';
   zimletInstance._dialog.popup(); 
   document.getElementById('ReplyFilterZimletBody').focus();    
};

ReplyFilterZimlet.prototype.setReplyBody = function()
{
   var zimletInstance = appCtxt._zimletMgr.getZimletByName('tk_barrydegraaff_reply_by_filter').handlerObject;
   try{
     zimletInstance.replyBody = document.getElementById('ReplyFilterZimletBody').value;
   } catch(err){console.log(err)}   
   zimletInstance._cancelBtn();
}
