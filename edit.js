Ext.onReady(function() {
    Ext.QuickTips.init();
    String.prototype.trim = function() { return this.replace(/^\s+|\s+$/g, ''); };
    var myMask = new Ext.LoadMask(Ext.getBody(), {msg:"Пожалуйста подождите..."});
    
    var store1 = new Ext.data.ArrayStore({
        fields: [ {name: 'name'},{name: 'id_city'},{name: 'id_oblast'} ],
        proxy: {
            actionMethods: 'POST',
            extraParams: {codex: 'getListRegion', all: 0,idCountry:-1},
            type: 'ajax',
            url : 'index.php',
            reader: { type: 'array' }
        }
    });

    var store2 = new Ext.data.ArrayStore({
        fields: [ {name: 'name'},{name: 'id_operator'},{name: 'id_city'},{name: 'id_oblast'} ],
        proxy: {
            actionMethods: 'POST',
            extraParams: {codex: 'getListOperator', id_oblast: 0, id_city: 0, all: 0},
            type: 'ajax',
            url : 'index.php',
            reader: { type: 'array' }
        }
    });
    
    var store3 = new Ext.data.ArrayStore({
        fields: ['product', 'date',
            'min', 'max', 
            {name: 'datenew', type: 'date', dateFormat: 'd-m-Y'},
            {name: 'minnew', type: 'float'},
            {name: 'maxnew', type: 'float'},'id_operator','id_city','id_oblast','id_product','group_name','comment'],
        groupField: 'group_name',
        proxy: {
            actionMethods: 'POST',
            extraParams: {codex: 'getListProduct', id_operator: 0, id_city: 0, id_oblast: 0, only_actual: 1},
            type: 'ajax',
            url : 'index.php',
            reader: { type: 'array' }
        },
        remoteSort: true,
        listeners: {
            'update': function(store,record,operation){
                /*myMask.show();
                Ext.Ajax.request({
                    url: 'index.php',
                    method: 'POST',
                    params: {
                        codex: 'setDataField',
                        datenew: record.get('datenew') ? Ext.Date.dateFormat(record.get('datenew'), 'Y-m-d') : 'NULL',
                        minnew: record.get('minnew'),
                        maxnew: record.get('maxnew'),
                        comment: record.get('comment'),
                        id_operator: record.get('id_operator'),
                        id_city: record.get('id_city'),
                        id_oblast: record.get('id_oblast'),
                        id_product: record.get('id_product')
                    },
                    success: function(response){ myMask.hide(); },
                    failure: function(response){ myMask.hide(); }
                });*/
            }
        }
    });
    
    var store4 = new Ext.data.ArrayStore({
        fields: [ {name: 'name'},{name: 'id_product'},{name: 'group_name'} ],
        groupField: 'group_name',
        proxy: {
            actionMethods: 'POST',
            extraParams: {codex: 'getListAllProduct', id_operator: 0, id_oblast: 0},
            type: 'ajax',
            url : 'index.php',
            reader: { type: 'array' }
        },
        remoteSort: true
    });

    function formatDate(value){
        return value ? Ext.Date.dateFormat(value, 'd-m-Y') : '';
    }
    var defaultDateField=new Ext.form.Date({
        value: new Date(),
        format: 'd-m-Y',
        startDay: 1,
        editable: false
    });
    var commentField=new Ext.form.field.TextArea({ flex: 1, id_operator: 0, heignt: 500});
    var saveCommentBut=new Ext.Button({
        text: 'Сохранить',
        iconCls: 'save_but',
        disabled: true,
        handler: function(){
            myMask.show();
            Ext.Ajax.request({
                url: 'index.php',
                method: 'POST',
                params: {
                    codex: 'setOperatorComment',
                    comment: commentField.getRawValue(),
                    id_operator: commentField.id_operator
                },
                success: function(response){ myMask.hide(); },
                failure: function(response){ myMask.hide(); }
            });
        }
    });
    var cellEditing = Ext.create('Ext.grid.plugin.CellEditing', {
        clicksToEdit: 1,
        listeners: {
            'edit': function(editor, data){
                var datenew=-1,minnew=-1,maxnew=-1,comment=-1;
                if((data.field=='minnew' || data.field=='maxnew') && data.value>0 && data.record.get('datenew')==null) {
                    data.record.set('datenew',defaultDateField.getRawValue());
                    datenew=data.record.get('datenew')?Ext.Date.dateFormat(data.record.get('datenew'),'Y-m-d'):'NULL';
                }
                if(data.field=='minnew') {
                    if(data.value>0)minnew=data.value;
                    if(data.record.get('maxnew')==0 || data.record.get('maxnew')<data.value) {
                        data.record.set('maxnew',data.value);
                        if(data.value>0)maxnew=data.value;
                    }
                    viewport.getComponent(2).getComponent(0).columns[6].field.setMinValue(data.value);
                }
                if(data.field=='maxnew') {
                    if(data.value>0)maxnew=data.value;
                }
                if(data.field=='datenew') {
                    if(data.value!=null)datenew=Ext.Date.dateFormat(data.value,'Y-m-d');
                }
                if(data.field=='comment') {
                    if(data.value!=null)comment=data.value;
                }
                if(datenew==-1 && minnew==-1 && maxnew==-1 && comment==-1)return;
                myMask.show();
                Ext.Ajax.request({
                    url: 'index.php',
                    method: 'POST',
                    params: {
                        codex: 'setDataField',
                        datenew: datenew,
                        minnew: minnew,
                        maxnew: maxnew,
                        comment: comment,
                        id_operator: data.record.get('id_operator'),
                        id_city: data.record.get('id_city'),
                        id_oblast: data.record.get('id_oblast'),
                        id_product: data.record.get('id_product')
                    },
                    success: function(response){ myMask.hide(); },
                    failure: function(response){ myMask.hide(); }
                });
            }
        }
    });
    
    var listCountry=Ext.create('Ext.form.field.ComboBox', {
        fieldLabel: 'Страна',
        labelWidth: 53,
        store: Ext.create('Ext.data.ArrayStore',{
            proxy: {
                actionMethods: 'POST',
                extraParams: {codex: 'getListCountry'},
                type: 'ajax',
                url : 'index.php',
                reader: { type: 'array' }
            },
            fields: [{name:'id'},{name:'name'}],
            listeners: { 'load': function(store,records,suc){ if(suc && records.length>0) listCountry.setValue(records[0].get('id')); } }
        }),
        editable: false,
        queryMode: 'local',
        displayField: 'name',
        valueField: 'id',
        listeners: {
            'change': function(cb,nv,ov){
                store1.getProxy().extraParams.idCountry=nv;
                store1.load();
                store2.removeAll();
                store3.removeAll();
                addProductBut.disable();
                saveCommentBut.disable();
            }
        }
    });
    var loginWin=Ext.create('Ext.Window',{
        title: 'Авторизация',
        iconCls: 'logout',
        width: 300,
        closable: false,
        resizable: false,
        draggable: false,
        modal: true,
        border: false,
        plain: true,
        defaultFocus: 'login',
        items: [ {
            xtype: 'panel',
            baseCls: 'x-plain',
            items: [{
                xtype: 'textfield',
                id: 'login',
                fieldLabel: 'Login',
                width: 270,
                allowBlank: false,
                blankText: 'Поле обязательно для заполнения'
            },{
                xtype: 'textfield',
                id: 'password',
                fieldLabel: 'Password',
                width: 270,
                allowBlank: false,
                inputType: 'password',
                blankText: 'Поле обязательно для заполнения'
            }]
        }],
        buttons: [{
            text: 'Вход',
            id: 'loginWinBut',
            handler: function(){
                if(!loginWin.getComponent(0).getComponent(0).isValid() || !loginWin.getComponent(0).getComponent(1).isValid())
                    alert('Необходимо заполнить обязательные поля.');
                else {
                    myMask.show();
                    Ext.Ajax.request({
                        url: 'index.php',
                        method: 'POST',
                        params: {
                            codex: 'auth',
                            login: loginWin.getComponent(0).getComponent(0).getValue(),
                            password: loginWin.getComponent(0).getComponent(1).getValue()
                        },
                        success: function(response){
                            myMask.hide();
                            var text = response.responseText.trim();
                            if(text=='1') {
                                map.destroy();
                                loginWin.destroy();
                                listCountry.store.load();
                            } else {
                                Ext.Msg.show({
                                    title: 'Ошибка',
                                    msg: 'Неправильная пара Login - Password.',
                                    minWidth: 200,
                                    modal: true,
                                    icon: Ext.Msg.ERROR,
                                    buttons: Ext.Msg.OK,
                                    closable: false,
                                    fn: function(){ }
                                });
                            }
                        },
                        failure: function(response){
                            myMask.hide();
                            Ext.Msg.show({
                                title: 'Ошибка',
                                msg: 'Передача данных не состоялась. Попробуйте ещё раз.',
                                minWidth: 200,
                                modal: true,
                                icon: Ext.Msg.ERROR,
                                buttons: Ext.Msg.OK,
                                closable: false,
                                fn: function(){ }
                            });
                        }
                    });
                }
            }
        }]
    }).show();
    var map = new Ext.util.KeyMap(loginWin.getId(), {
        key: Ext.EventObject.ENTER, //13
        handler: function(){
            loginWin.query('#loginWinBut')[0].handler();
        },
        scope: this
    });
    
    var productWin=new Ext.Window({
        title: 'Добавление продукта',
        width: 550,
        height: 550,
        layout: 'fit',
        closable: false,
        resizable: false,
        modal: true,
        border: false,
        plain: true,
        items: [new Ext.ux.LiveSearchGridPanel({
            store: store4,
            autoScroll: true,
            columns: [ {header: 'Наименование', dataIndex: 'name', flex:1, menuDisabled: true} ],
            features: [Ext.create('Ext.grid.feature.Grouping',{
                groupHeaderTpl: 'Группа: {name} (продуктов: {rows.length})',
                startCollapsed: true
            })]
        })],
        buttons: [{
            text: 'OK',
            iconCls: 'accept',
            handler: function(){
                if(productWin.getComponent(0).getSelectionModel().hasSelection()) {
                    productWin.query('textfield')[0].reset();
                    
                    myMask.show();
                    Ext.Ajax.request({
                        url: 'index.php',
                        method: 'POST',
                        params: {
                            codex: 'addProduct',
                            id_oblast: viewport.getComponent(0).getComponent(0).getSelectionModel().getSelection()[0].get('id_oblast'),
                            id_city: viewport.getComponent(0).getComponent(0).getSelectionModel().getSelection()[0].get('id_city'),
                            id_operator: viewport.getComponent(1).getComponent(0).getSelectionModel().getSelection()[0].get('id_operator'),
                            id_product: productWin.getComponent(0).getSelectionModel().getSelection()[0].get('id_product')
                        },
                        success: function(response){
                            myMask.hide();
                            productWin.hide();
                            store3.load();
                        },
                        failure: function(response){
                            myMask.hide();
                            Ext.Msg.show({
                                title: 'Ошибка',
                                msg: 'Передача данных не состоялась. Попробуйте ещё раз.',
                                minWidth: 200,
                                modal: true,
                                icon: Ext.Msg.ERROR,
                                buttons: Ext.Msg.OK,
                                closable: false,
                                fn: function(){ }
                            });
                        }
                    });
                } else {
                    alert("Необходимо выбрать продукт.");
                }
            }
        },{
            text: 'Cancel',
            iconCls: 'cancel_but',
            handler: function(){
                productWin.query('textfield')[0].reset();
                productWin.hide();
            }
        }]
    });
    var addProductBut=new Ext.Button({
        text: 'Добавить продукт',
        iconCls: 'add_but',
        disabled: true,
        handler: function(){
            if(viewport.getComponent(0).getComponent(0).getSelectionModel().hasSelection() &&
                viewport.getComponent(1).getComponent(0).getSelectionModel().hasSelection()) {
                store4.getProxy().extraParams.id_operator=viewport.getComponent(1).getComponent(0).getSelectionModel().getSelection()[0].get('id_operator');
                store4.getProxy().extraParams.id_oblast=viewport.getComponent(0).getComponent(0).getSelectionModel().getSelection()[0].get('id_oblast');
                store4.load();
                productWin.show();
            }
        }
    });
    var onlyActualRecord=new Ext.form.Checkbox({
        boxLabel: 'Только актуальные записи',
        checked: true,
        listeners: {
            'change': function(checkbox,newvalue,oldvalue){
                if(viewport.getComponent(0).getComponent(0).getSelectionModel().hasSelection() &&
                    viewport.getComponent(1).getComponent(0).getSelectionModel().hasSelection()) {
                    store3.getProxy().extraParams.id_operator=viewport.getComponent(1).getComponent(0).getSelectionModel().getSelection()[0].get('id_operator');
                    store3.getProxy().extraParams.id_oblast=viewport.getComponent(0).getComponent(0).getSelectionModel().getSelection()[0].get('id_oblast');
                    store3.getProxy().extraParams.only_actual=onlyActualRecord.getValue()?1:0;
                    store3.load();
                }
            }
        }
    });
    
    var viewport = new Ext.Viewport({
        layout: {
            type: 'border',
            pack: 'start',
            align: 'stretch'
        },
        items: [new Ext.Panel({
            title: 'Города',
            collapsible: true,
            collapseDirection: 'left',
            region: 'west',
            split: true,
            layout: 'fit',
            bodyStyle: 'border: 0px;',
            width: 220,
            items: [new Ext.grid.Panel({
                store: store1,
                columns: [ {header: 'Наименование', dataIndex: 'name', flex:1, menuDisabled: true} ],
                listeners: {
                    'selectionchange': function(view,records){
                        if(records[0]==undefined) return false;
                        store2.getProxy().extraParams.id_oblast=records[0].get('id_oblast');
                        store2.getProxy().extraParams.id_city=records[0].get('id_city');
                        store2.load();
                        commentField.reset();
                        addProductBut.disable();
                        saveCommentBut.disable();
                        store3.removeAll();
                    }
                }
            })],
            tbar: [{
                xtype: 'buttongroup',
                columns: 1,
                items: [
                    new Ext.form.field.Radio({
                        name: 'all_city',
                        boxLabel: 'Все',
                        id: 'all_city_1',
                        listeners: {
                            'change': function(radio,newValue,oldValue){
                                if(newValue){
                                    store1.getProxy().extraParams.all=1;
                                    store1.load();
                                    store2.removeAll();
                                    store3.removeAll();
                                    addProductBut.disable();
                                    saveCommentBut.disable();
                                }
                            }
                        }
                    }),
                    new Ext.form.field.Radio({
                        name: 'all_city',
                        boxLabel: 'Только те что с данными',
                        checked: true,
                        id: 'all_city_2',
                        listeners: {
                            'change': function(radio,newValue,oldValue){
                                if(newValue){
                                    store1.getProxy().extraParams.all=0;
                                    store1.load();
                                    store2.removeAll();
                                    store3.removeAll();
                                    addProductBut.disable();
                                    saveCommentBut.disable();
                                }
                            }
                        }
                    }),listCountry
                ]
            }]
        }),new Ext.Panel({
            title: 'Оператор',
            region: 'center',
            layout: {
                type: 'vbox',
                align : 'stretch',
                pack  : 'start'
            },
            bodyStyle: 'border: 0px;',
            width: 250,
            items: [new Ext.ux.LiveSearchGridPanel({
                store: store2,
                flex: 1,
                columns: [ {header: 'Наименование', dataIndex: 'name', flex:1, menuDisabled: true} ],
                listeners: {
                    'selectionchange': function(view,records){
                        if(records[0]==undefined) return false;
                        myMask.show();
                        store3.getProxy().extraParams.id_operator=records[0].get('id_operator');
                        store3.getProxy().extraParams.id_oblast=records[0].get('id_oblast');
                        store3.getProxy().extraParams.id_city=records[0].get('id_city');
                        store3.getProxy().extraParams.only_actual=onlyActualRecord.getValue()?1:0;
                        store3.load();
                        addProductBut.enable();
                        saveCommentBut.enable();
                        Ext.Ajax.request({
                            url: 'index.php',
                            method: 'POST',
                            params: {
                                codex: 'getOperatorComment',
                                id_operator: records[0].get('id_operator')
                            },
                            success: function(response){
                                myMask.hide();
                                commentField.id_operator=records[0].get('id_operator');
                                commentField.setValue(response.responseText.trim());
                            },
                            failure: function(response){ myMask.hide(); }
                        });
                    }
                }
            }),new Ext.Panel({
                bodyStyle: 'border: 0px;',
                title: 'Комментарий к оператору',
                collapsible: true,
                collapseDirection: 'bottom',
                layout: 'fit',
                flex: 1,
                items: [ commentField ],
                buttons: [ saveCommentBut]
            })],
            tbar: [
                new Ext.form.field.Radio({
                    name: 'all_oper',
                    boxLabel: 'Все',
                    id: 'all_1',
                    listeners: {
                        'change': function(radio,newValue,oldValue){
                            if(newValue){
                                store2.getProxy().extraParams.all=1;
                                if(store2.getProxy().extraParams.id_oblast!=0){
                                    store2.load();
                                    store3.removeAll();
                                    addProductBut.disable();
                                    saveCommentBut.disable();
                                }
                            }
                        }
                    }
                }),'-',
                new Ext.form.field.Radio({
                    name: 'all_oper',
                    boxLabel: 'Только те что в городе',
                    checked: true,
                    id: 'all_2',
                    listeners: {
                        'change': function(radio,newValue,oldValue){
                            if(newValue){
                                store2.getProxy().extraParams.all=0;
                                if(store2.getProxy().extraParams.id_oblast!=0){
                                    store2.load();
                                    store3.removeAll();
                                    addProductBut.disable();
                                    saveCommentBut.disable();
                                }
                            }
                        }
                    }
                })
            ]
        }),new Ext.Panel({
            title: 'Данные'+' (дата синхронизации <span style="color: red;">'+last_date+'</span>)',
            layout: {
                type: 'vbox',
                align : 'stretch',
                pack  : 'start'
            },
            bodyStyle: 'border: 0px;',
            region: 'east',
            split: true,
            flex: 2,
            items: [new Ext.grid.Panel({
                store: store3,
                columns: [
                    {header: 'Продукт',  dataIndex: 'product', flex:1, menuDisabled: true},
                    {header: 'Дата', dataIndex: 'date', width: 100, align: 'center', menuDisabled: true},
                    {header: 'MIN', dataIndex: 'min', width: 75, align: 'center', menuDisabled: true},
                    {header: 'MAX', dataIndex: 'max', width: 75, align: 'center', menuDisabled: true},
                    {header: 'Дата new', dataIndex: 'datenew', width: 100, align: 'center', menuDisabled: true,
                        renderer: formatDate,
                        field: new Ext.form.Date({
                            //xtype: 'datefield',
                            format: 'd-m-Y',
                            minValue: '01-01-2006',
                            startDay: 1,
                            editable: false
                        })
                    },
                    {header: 'MIN new', dataIndex: 'minnew', width: 75, align: 'center', menuDisabled: true,
                        field: {
                            xtype: 'numberfield',
                            allowBlank: false,
                            minValue: 0,
                            maxValue: 90000000
                        }
                    },
                    {header: 'MAX new', dataIndex: 'maxnew', width: 75, align: 'center', menuDisabled: true,
                        field: new Ext.form.Number({
                            //xtype: 'numberfield',
                            allowBlank: false,
                            minValue: 0,
                            maxValue: 90000000
                        })
                    },{
                        xtype: 'actioncolumn',
                        width: 25,
                        items: [{
                            icon   : 'images/clear.png',
                            tooltip: 'сброс новых данных',
                            handler: function(grid, rowIndex, colIndex) {
                                var rec = store3.getAt(rowIndex);
                                rec.set('minnew',0);
                                rec.set('maxnew',0);
                                rec.set('datenew','');
                                myMask.show();
                                Ext.Ajax.request({
                                    url: 'index.php',
                                    method: 'POST',
                                    params: {
                                        codex: 'setDataField',
                                        datenew: 'NULL',
                                        minnew: 0,
                                        maxnew: 0,
                                        comment: -1,
                                        id_operator: rec.get('id_operator'),
                                        id_city: rec.get('id_city'),
                                        id_oblast: rec.get('id_oblast'),
                                        id_product: rec.get('id_product')
                                    },
                                    success: function(response){ myMask.hide(); },
                                    failure: function(response){ myMask.hide(); }
                                });
                            }
                        }]
                    },{header: 'Комментарий',  dataIndex: 'comment', flex:1, menuDisabled: true,field: {
                        
                    }}
                ],
                features: [Ext.create('Ext.grid.feature.Grouping',{
                    groupHeaderTpl: 'Группа: {name} (продуктов: {rows.length})'
                })],
                flex: 1,
                plugins: [cellEditing],
                listeners: {
                    'selectionchange': function(selmodel, selarray){
                        if(selarray[0]!=undefined) {
                            if(selarray[0].get('date')!=='' || selarray[0].get('date')!=undefined)
                                viewport.getComponent(2).getComponent(0).columns[4].field.setMinValue(new Date(selarray[0].get('date').replace(/(\d+)-(\d+)-(\d+)/, '$2/$1/$3')));
                            else
                                viewport.getComponent(2).getComponent(0).columns[4].field.setMinValue(new Date('01/01/2006'));
                            if(selarray[0].get('minnew')!=='' && selarray[0].get('minnew')!=undefined) {
                                viewport.getComponent(2).getComponent(0).columns[6].field.setMinValue(selarray[0].get('minnew'));
                            }
                        }
                    }
                }
            })],
        tbar: [ addProductBut,'-',defaultDateField,'-',onlyActualRecord ]
        })]
    });
});