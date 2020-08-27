#!/bin/bash
ZIMLET_NAME="tk_barrydegraaff_reply_by_filter"
cd "${ZIMLET_NAME}"
zip -r ../${ZIMLET_NAME}.zip *
cd ..
echo 'An installable version of zimlet was created on: '"${ZIMLET_NAME}"'.zip'

exit 0

