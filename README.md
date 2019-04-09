# Zimbra send replies triggered by filters (beta work in progress)

While you could always configure Zimbra filters to send automated replies over CLI using:

`/opt/zimbra/bin/zmmailbox -z -m account@domain.com afrl "Filter_name" active any address "to,cc" all is "alias@domain.com" reply "Auto reply message" stop` 

this feature was not available to the end user in the Web Interface.

This Zimlet adds a button in Preferences -> Filters -> Create Filter to add this functionality.

For now only deployment in development mode is supported, place the zimlet files on your server like so:


      [root@zimbradev ~]# ls -w1 /opt/zimbra/zimlets-deployed/_dev/tk_barrydegraaff_reply_by_filter/
      tk_barrydegraaff_reply_by_filter.js
      tk_barrydegraaff_reply_by_filter.xml
      
