<?php
include("edit_db.php");
session_start();
$id_user=0;
if(isset($_POST['codex']) && $_POST['codex']!='auth') {
    $res=mysql_query("select id from users where session='".session_id()."';");
    if(mysql_num_rows($res)==1) {
        $row=mysql_fetch_array($res);
        $id_user=$row['id'];
    } else {
        if($_POST['codex']=='getOperatorComment') exit('');
        else exit('[]');
    }
}

function ParsePOST($post)
{
    $ar=array(">","<","union");
    return str_replace($ar,'',$post);
}
function ViewPage()
{
    $row=mysql_fetch_array(mysql_query("select DATE_FORMAT(last_date_azs,'%d.%m.%Y %H:%m') as last_date from last_date;"));
    echo '<!DOCTYPE HTML PUBLIC "-//W3C//DTD HTML 4.01//EN" "http://www.w3.org/TR/html4/strict.dtd">
<html>
<head>
    <title>Внесение изменений по ценам АЗС</title>
    <meta http-equiv="Content-Type" content="text/html; charset=UTF-8">
    <link rel="stylesheet" type="text/css" href="resources/css/ext-all.css" />
    <link rel="stylesheet" type="text/css" href="statusbar.css" />
    <link rel="stylesheet" type="text/css" href="LiveSearchGridPanel.css" />
    <link rel="stylesheet" type="text/css" href="edit.css" />
    <script type="text/javascript" src="ext-all.js"></script>
    <script type="text/javascript" src="ext-lang-ru.js"></script>
    <script type="text/javascript" src="StatusBar.js"></script>
    <script type="text/javascript" src="LiveSearchGridPanel.js"></script>
    <script type="text/javascript" src="jquery-1.6.1.min.js"></script>
    <script type="text/javascript" src="edit.js"></script>
    <script type="text/javascript">
    var last_date=\''.(isset($row['last_date'])?$row['last_date']:'').'\';
    </script>
</head>
<body></body>
</html>';
}
function getListRegion(){
    global $id_user;
    if($id_user==0 || $_POST['idCountry']==-1) { echo '[]'; return false; }
    $addQuery="";
    if($_POST['all']==0)$addQuery="join TABLE_DATA_AZS as tda on tda.ID_CITY=sc.ID_CITY";
    $res=mysql_query("select sc.ID_CITY,sc.NAME,sc.ID_OBLAST
        from SPR_CITY as sc
        ".$addQuery."
        where sc.ID_OBLAST in 
        (
            select ID_OBLAST from USER_OBLAST where ID_USER=".$id_user." and ID_TASK=2
            AND ID_OBLAST IN (SELECT ID_OBLAST FROM SPR_OBLAST WHERE ID_COUNTRY=".$_POST['idCountry'].")
        )
        group by sc.ID_CITY,sc.NAME,sc.ID_OBLAST order by sc.NAME;");
    if(mysql_num_rows($res)>0) {
        $str='';
        for($i=0;$i<mysql_num_rows($res);$i++) {
            $row=mysql_fetch_array($res);
            $str[]="['".$row['NAME']."',".$row['ID_CITY'].",".$row['ID_OBLAST']."]";
        }
        echo "[".implode(",",$str)."]";
        
    } else echo '[]';
}
function getListOperator()
{
    $addQuery="";
    if($_POST['all']==0)
        $addQuery="where ID_OPERATOR in (select ID_OPERATOR from TABLE_DATA_AZS
            where ID_CITY=".$_POST['id_city']." and ID_OBLAST=".$_POST['id_oblast'].")";
    $res=mysql_query("select ID_OPERATOR,NAME from SPR_OPERATOR_AZS ".$addQuery." order by NAME;");
    if(mysql_num_rows($res)>0) {
        $str='';
        for($i=0;$i<mysql_num_rows($res);$i++) {
            $row=mysql_fetch_array($res);
            $str[]="['".$row['NAME']."',".$row['ID_OPERATOR'].",".$_POST['id_city'].",".$_POST['id_oblast']."]";
        }
        echo "[".implode(",",$str)."]";
        
    } else echo '[]';
}
function getListProduct()
{
    $addSQL='';
    if(ParsePOST($_POST['only_actual'])==1)
        $addSQL=' and (IFNULL(tda.ID_RECORD,0)!=0 or tda.DATE_NEW is not null)';
    $res=mysql_query("select tda.ID_OPERATOR,tda.ID_OBLAST,tda.ID_CITY,tda.ID_PRODUCT,
        DATE_FORMAT(tda.DATE_LAST,'%d-%m-%Y') as DATE_LAST,tda.MIN_LAST,tda.MAX_LAST,
        DATE_FORMAT(tda.DATE_NEW,'%d-%m-%Y') as DATE_NEW,tda.MIN_NEW,tda.MAX_NEW,
        spa.NAME,spa.NAME_GROUP as GROUP_NAME,
        IFNULL(tda.ID_RECORD,0) as ID_RECORD,tda.COMMENT_
        from TABLE_DATA_AZS as tda
        join SPR_PRODUCT_AZS as spa on spa.ID_PRODUCT=tda.ID_PRODUCT
        where tda.ID_OPERATOR=".ParsePOST($_POST['id_operator'])." and 
            tda.ID_OBLAST=".ParsePOST($_POST['id_oblast'])." and 
            tda.ID_CITY=".ParsePOST($_POST['id_city']).$addSQL."
        order by spa.NAME_GROUP,spa.ORDER_,spa.NAME;");
    if(mysql_num_rows($res)>0) {
        $str='';
        for($i=0;$i<mysql_num_rows($res);$i++) {
            $row=mysql_fetch_array($res);
            $str[]="['".($row['ID_RECORD']?'':'<img src="images/del_but.gif" title="Не актуальная запись"/>').'&nbsp;'.$row['NAME']."','".$row['DATE_LAST']."',".$row['MIN_LAST'].",".$row['MAX_LAST'].",
                '".$row['DATE_NEW']."',".$row['MIN_NEW'].",".$row['MAX_NEW'].",".$row['ID_OPERATOR'].",".$row['ID_CITY'].",
                ".$row['ID_OBLAST'].",".$row['ID_PRODUCT'].",'".$row['GROUP_NAME']."'
                ,'".$row['COMMENT_']."']";
        }
        echo "[".implode(",",$str)."]";
        
    } else echo '[]';
}
function getOperatorComment()
{
    $res=mysql_query("select COMMENT from OPERATOR_COMMENT_AZS where ID_OPERATOR=".ParsePOST($_POST['id_operator']).";");
    if(mysql_num_rows($res)>0) {
        $row=mysql_fetch_array($res);
        echo trim($row['COMMENT']);
    } else echo '';
}
function setOperatorComment()
{
    global $id_user;
    if($id_user==0) return;
    $row=mysql_fetch_array(mysql_query("select count(*) as cnt from OPERATOR_COMMENT_AZS 
        where ID_OPERATOR=".ParsePOST($_POST['id_operator']).";"));
    if($row['cnt']>0) {
        if(trim($_POST['comment'])!='')
            mysql_query("update OPERATOR_COMMENT_AZS set COMMENT='".ParsePOST(trim($_POST['comment']))."'
            where ID_OPERATOR=".ParsePOST($_POST['id_operator']).";");
        else
            mysql_query("delete from OPERATOR_COMMENT_AZS where ID_OPERATOR=".ParsePOST($_POST['id_operator']).";");
    } else {
        if(trim($_POST['comment'])!='')
            mysql_query("insert into OPERATOR_COMMENT_AZS (ID_OPERATOR,COMMENT) 
            values (".ParsePOST($_POST['id_operator']).",'".ParsePOST(trim($_POST['comment']))."');");
    }
}
function setDataField()
{
    global $id_user;
    if($id_user==0) return;
    $date_new="";
    if($_POST['datenew']!='-1' || $_POST['datenew']!=-1)$date_new="DATE_NEW='".ParsePOST($_POST['datenew'])."',";
    if($_POST['datenew']=='NULL' || $_POST['datenew']==NULL)$date_new="DATE_NEW=NULL,";
    
    $min_new="";
    if($_POST['minnew']!='-1' || $_POST['minnew']!=-1)$min_new="MIN_NEW=".ParsePOST($_POST['minnew']).",";
    if($_POST['minnew']=='0' || $_POST['minnew']==0)$min_new="MIN_NEW=NULL,";
    
    $max_new="";
    if($_POST['maxnew']!='-1' || $_POST['maxnew']!=-1)$max_new="MAX_NEW=".ParsePOST($_POST['maxnew']).",";
    if($_POST['maxnew']=='0' || $_POST['maxnew']==0)$max_new="MAX_NEW=NULL,";
    
    $comment="";
    if($_POST['comment']!='-1' || $_POST['comment']!=-1)
        $comment="COMMENT_='".ParsePOST($_POST['comment'])."',";
    if($_POST['comment']=='')$comment="COMMENT_='',";
    
    mysql_query("update TABLE_DATA_AZS set ".$date_new.$min_new.$max_new.$comment."
        ID_USER=".$id_user.",DATE_UPD=NOW()
        where ID_OPERATOR=".ParsePOST($_POST['id_operator'])." and ID_OBLAST=".ParsePOST($_POST['id_oblast'])."
             and ID_CITY=".ParsePOST($_POST['id_city'])." and ID_PRODUCT=".ParsePOST($_POST['id_product']).";");
}
function auth()
{
    global $id_user;
    $res=mysql_query("select id from users where 
        login='".ParsePOST($_POST['login'])."' and pass='".ParsePOST($_POST['password'])."';");
    if(mysql_num_rows($res)==1) {
        $row=mysql_fetch_array($res);
        $id_user=$row['id'];
        mysql_query("update users set session='' where session='".session_id()."';");
        mysql_query("update users set session='".session_id()."',lastvisit=NOW() where id=".$row['id'].";");
        echo 1;
    } else echo 0;
}
function getListAllProduct()
{
    $res=mysql_query("select ID_PRODUCT,NAME,NAME_GROUP from SPR_PRODUCT_AZS
        order by NAME_GROUP,ORDER_,NAME;");
    if(mysql_num_rows($res)>0) {
        $str='';
        for($i=0;$i<mysql_num_rows($res);$i++) {
            $row=mysql_fetch_array($res);
            $str[]="['".$row['NAME']."',".$row['ID_PRODUCT'].",'".$row['NAME_GROUP']."']";
        }
        echo "[".implode(",",$str)."]";
        
    } else echo '[]';
}
function addProduct()
{
    global $id_user;
    if($id_user==0) return;
    mysql_query("insert into TABLE_DATA_AZS (ID_OPERATOR,ID_OBLAST,ID_CITY,ID_PRODUCT,DATE_LAST,MIN_LAST,MAX_LAST,
        DATE_NEW,MIN_NEW,MAX_NEW,ID_USER,DATE_UPD,COMMENT_) 
        values (".ParsePOST($_POST['id_operator']).",".ParsePOST($_POST['id_oblast']).",".ParsePOST($_POST['id_city']).",
            ".ParsePOST($_POST['id_product']).",null,null,null,null,null,null,".$id_user.",NOW(),null);");
}
function cmdSpecComment()
{
    global $id_user;
    if($id_user==0) return;
    if(!isset($_POST['cmd'])) return;
    $cmd=ParsePOST($_POST['cmd']);
    if($cmd==1)
        mysql_query("update OPERATOR_COM set DATE2=now()-interval 1 day,DATE_UPD=now(),FLAG=1,user_upd=".$id_user."
            where ID_OPERATOR=".ParsePOST($_POST['id_operator']).";");
    else if($cmd==2)
        mysql_query("update OPERATOR_COM set COMRUS='".ParsePOST($_POST['comrus'])."',
            COMENG='".ParsePOST($_POST['comeng'])."',DATE_UPD=now(),FLAG=2,user_upd=".$id_user."
            where ID_OPERATOR=".ParsePOST($_POST['id_operator'])." and ID_COMMENT=".ParsePOST($_POST['id_comment']).";");
    else if($cmd==3)
        mysql_query("update OPERATOR_COM set COMRUS='".ParsePOST($_POST['comrus'])."',
            COMENG='".ParsePOST($_POST['comeng'])."',DATE1=now(),DATE2='2100.01.01',
            DATE_UPD=now(),FLAG=3,user_upd=".$id_user."
            where ID_OPERATOR=".ParsePOST($_POST['id_operator']).";");
    else return;
}
function getSpecComment()
{
    $res=mysql_query("select ID_COMMENT,COMRUS,COMENG,DATE1,DATE2 from OPERATOR_COM
        where ID_OPERATOR=".ParsePOST($_POST['id_operator']).";");
    if(mysql_num_rows($res)!=1){echo 0;return;}
    else {
        $row=mysql_fetch_array($res);
        echo $row['ID_COMMENT'].":".$row['COMRUS'].":".$row['COMENG'].":".$row['DATE1'].":".$row['DATE2'];
    }
}
function getListCountry(){
    $res=mysql_query("SELECT ID,NAME FROM SPR_COUNTRY;");
    if(mysql_num_rows($res)>0) {
        $str='';
        for($i=0;$i<mysql_num_rows($res);$i++) {
            $row=mysql_fetch_array($res);
            $str[]="[".$row['ID'].",'".$row['NAME']."']";
        }
        echo "[".implode(",",$str)."]";
        
    } else echo '[]';
}
switch($_POST['codex']) {
    default: ViewPage(); break;
    case 'getListRegion': getListRegion(); break;
    case 'getListOperator': getListOperator(); break;
    case 'getListProduct': getListProduct(); break;
    case 'getOperatorComment': getOperatorComment(); break;
    case 'setOperatorComment': setOperatorComment(); break;
    case 'setDataField': setDataField(); break;
    case 'auth': auth(); break;
    case 'getListAllProduct': getListAllProduct(); break;
    case 'addProduct': addProduct(); break;
    case 'cmdSpecComment': cmdSpecComment(); break;
    case 'getSpecComment': getSpecComment(); break;
    case 'getListCountry': getListCountry(); break;
}
?>   
