/**
 * Created by CL on 2016/6/26.
 */
(function(window){
    var CL3D = window.CL3D || (window.CL3D = {});
    var clStatic={};
    var canvas;
    var gl;

    var Class=(function(){
        var _mix=function(r,s){
            for(var p in s){
                if(s.hasOwnProperty(p)){
                    r[p]=s[p];
                }
            }
        };

        var _extend=function(){
            this.initPrototype=true;
            var prototype=new this();
            this.initPrototype=false;

            var items=Array.prototype.slice.call(arguments)||[];
            var item;

            while(item=items.shift()){
                _mix(prototype,item.prototype||item);
            }

            function SubClass(){
                if(!SubClass.initPrototype&&this.init){
                    this.init.apply(this,arguments);
                }
            }

            SubClass.prototype=prototype;
            SubClass.prototype.constructor=SubClass;
            SubClass.extend=_extend;
            return SubClass;
        };

        var Class=function(){
        };
        Class.extend=_extend;
        return Class;
    })();

    var BaseScene=Class.extend({
        init:function(){
            this.meshArray=[];
        },
        add:function(mesh){
            this.meshArray.push(mesh);
            mesh.index=this.meshArray.length-1;
        },
        remove:function(index){
            //this.meshArray[index]
            delete this.meshArray[index];
        },
        eachElement:function(f){
            var that=this;
            this.meshArray.forEach(function(v){
                if(v instanceof BaseMesh){
                    f.call(v);
                }
            });
        }
    });

    /**
     * 网格的基础类
     */
    var BaseMesh=Class.extend({
        /**
         * vertices=[[v1],[v2],...];indices=[[v,c,t,n],[v,c,t,n],...];mtls=[...]
         * @param vertices
         * @param indices
         * @param mtls
         */
        init:function(vertices,indices,mtls){
            this.vertices=vertices;
            this.indices=indices;
            this.mtls=mtls;
            this.static=true;
            //this.shaderDataBufferKeys=[BaseShader.initShaderKey];
            this.initShaderKeyAndData();
        },
        setTextures:function(textures){
            this.textures=textures;
        },
        setNormals:function(normals){
            this.normals=normals;
            this.hasNormal=true;
        },
        combineMesh:function(attributeArray){
            var colorData={};
            for(p in attributeArray){
                if(attributeArray.hasOwnProperty(p)){
                    colorData[attributeArray[p]]=[];
                }
            }
            if(this.indices.length%3!==0){
                console.log('mesh data error!');
                return;
            }
            var that=this;
            this.indices.forEach(function(v,i,a){

                if((v[2]&&attributeArray['texture'])||(!v[2]&&!attributeArray['texture'])){
                    for(p in attributeArray) {
                        if (attributeArray.hasOwnProperty(p)) {

                            if (p == 'color') {
                                if (v[1]!=undefined) {
                                    that.mtls[v[1]].color.forEach(function (_v) {
                                        colorData[attributeArray[p]].splice(colorData[attributeArray[p]].length, 0, _v);
                                    });
                                } else {
                                    var _color = [0.0, 0.0, 0.0, 0.0];
                                    _color.forEach(function (_v) {
                                        colorData[attributeArray[p]].splice(colorData[attributeArray[p]].length, 0, _v);
                                    });
                                }
                            } else {
                                if (BaseShader.supportParamsList[p]) {

                                    if (v[BaseShader.supportParamsList[p].index]!==undefined) {

                                        that[BaseShader.supportParamsList[p].name][v[BaseShader.supportParamsList[p].index]].forEach(function (_v) {
                                            colorData[attributeArray[p]].splice(colorData[attributeArray[p]].length, 0, _v);
                                        });
                                    } else {
                                        BaseShader.supportParamsList[p].default.forEach(function (_v) {
                                            colorData[attributeArray[p]].splice(colorData[attributeArray[p]].length, 0, _v);
                                        });
                                    }
                                }
                            }
                        }
                    }
                }
            });
            return colorData;
        },
        connectToShader: function (shaderDataBufferList) {
            var keys=this.getShaderKeys();
            for(var i=0;i<keys.length;i++){
                if(shaderDataBufferList[keys[i]]){

                    this.shaderKeyAndData[keys[i]]._data=this.combineMesh(shaderDataBufferList[keys[i]]._shader.attributeParams);
                    for(_p in this.shaderKeyAndData[keys[i]]._data){
                        if(this.shaderKeyAndData[keys[i]]._data.hasOwnProperty(_p)){
                            (!shaderDataBufferList[keys[i]]._data[_p])&&(shaderDataBufferList[keys[i]]._data[_p]=[]);
                            if(shaderDataBufferList[keys[i]]._data[_p]&&shaderDataBufferList[keys[i]]._data[_p] instanceof Array){
                                this.shaderKeyAndData[keys[i]]._data[_p].forEach(function(v){
                                    shaderDataBufferList[keys[i]]._data[_p].splice(shaderDataBufferList[keys[i]]._data[_p].length,0,v);
                                });
                            }
                        }
                    }
                }
            }
        },
        //initBuffer:function(){
        //    var buffer={};
        //    if(this.colorArray.length!==0){
        //        buffer.colorArrayBuffer=gl.createBuffer();
        //    }
        //    if(this.colorTextureArray.length!==0){
        //        buffer.colorTextureArrayBuffer=gl.createBuffer();
        //    }
        //    this.buffer=buffer;
        //    return buffer;
        //},
        //bufferData:function(){
        //    if(this.static){
        //        gl.bindBuffer(gl.ARRAY_BUFFER,this.buffer.colorArrayBuffer);
        //        gl.bufferData(gl.ARRAY_BUFFER,this.colorArray,gl.STATIC_DRAW);
        //        gl.bindBuffer(gl.ARRAY_BUFFER,this.buffer.colorTextureArrayBuffer);
        //        gl.bufferData(gl.ARRAY_BUFFER,this.colorTextureArray,gl.STATIC_DRAW);
        //    }
        //},
        //vertexColorPointer:function(variables){
        //    gl.bindBuffer(gl.ARRAY_BUFFER,this.buffer.colorArrayBuffer);
        //    gl.vertexAttribPointer(variables['a_Position'],3,gl.FLOAT,false,0,7);
        //    gl.enableVertexAttribArray(variables['a_Position']);
        //    gl.vertexAttribPointer(variables['a_Color'],4,gl.FLOAT,false,3,6);
        //    gl.enableVertexAttribArray(variables['a_Color']);
        //    gl.vertexAttribPointer(variables['a_Normal'],3,gl.FLOAT,false,7,7);
        //    gl.enableVertexAttribArray(variables['a_Normal']);
        //},
        //vertexColorTexturePointer:function(variables){
        //
        //},
        initShaderKeyAndData:function(){
            this.shaderKeyAndData={};
            this.shaderKeyAndData[BaseShader.initShaderKey]={};
        },
        getShaderKeys:function(){
            var result=[];
            for(p in this.shaderKeyAndData){
                if(this.shaderKeyAndData.hasOwnProperty(p)){
                    result.push(p);
                }
            }
            return result;
        },
        setShaderKeys:function(keys){
            this.shaderKeyAndData={};
            this.addShaderKeys(keys);
        },
        addShaderKeys:function(keys){
            if(keys instanceof Array){
                var that=this;
                keys.forEach(function(v){
                    if(typeof v=="string")that.shaderKeyAndData[v]={};
                })
            }else {
                if(typeof keys=="string")this.shaderKeyAndData[keys]={};
            }
        }
    });

    /**
     * 材质
     * @param color
     * @param texture
     * @constructor
     */
    function Material(color,texture){

    }
    var BaseMaterial=Class.extend({
        init:function(color,texture){
            this.color=color;
            texture&&(this.texture=texture);
        }
    });

    var BaseCamera=Class.extend({
        init:function(fov,aspect,near,far){
            this.fov=fov;
            this.aspect=aspect;
            this.near=near;
            this.far=far;
        },
        lookAt:function(v1,v2,v3){
            var v=[].concat(v1,v2,v3);
            this.lookAtElement=v;
        },
        getMvpMatrix:function(){
            var mvpMatrix=new Matrix4();
            mvpMatrix.setPerspective(this.fov,this.aspect,this.near,this.far);

            console.log(this.lookAtElement);
            mvpMatrix.lookAt.apply(mvpMatrix,this.lookAtElement);
            console.log(mvpMatrix.elements);
            return mvpMatrix;
        }
    });

    /**
     *渲染器
     */
    var BaseRenderer=Class.extend({
        init:function(props){
            props.canvas&&(canvas=props.canvas);
            if(!canvas)canvas=window.document.createElement('canvas');
            this.elementDom=canvas;
            gl=getWebGLContext(canvas);
            if(!gl){
                console.log('Failed to get the rendering context for WebGL');
            }
            this.width=canvas.width||0;
            this.height=canvas.height||0;
            this.shaderDataBufferList={};
            this.shaderDataBufferList[BaseShader.initShaderKey]=new ShaderDataBuffer(BaseShader.initShader);
        },
        render: function (scene,camera) {
            var _that=this;
            this.scene=scene;
            this.camera=camera;

            gl.clearColor(0.0,0.0,0.0,1.0);
            gl.enable(gl.DEPTH_TEST);
            gl.clear(gl.COLOR_BUFFER_BIT|gl.DEPTH_BUFFER_BIT);

            this.scene.eachElement(function(){
                this.connectToShader(_that.shaderDataBufferList);
            });

            console.log(this.shaderDataBufferList);

            for(p in this.shaderDataBufferList){
                if(this.shaderDataBufferList.hasOwnProperty(p)){

                    console.log(p);
                    if(!this.shaderDataBufferList[p]._shader['_program']){
                        this.shaderDataBufferList[p]._shader['_program']=createProgram(gl,this.shaderDataBufferList[p]._shader.getVertexShaderCode(),this.shaderDataBufferList[p]._shader.getFragmentShaderCode());
                    }
                    gl.useProgram(this.shaderDataBufferList[p]._shader['_program']);

                    var oldLen=0;
                    var length=0;

                    for(_p in this.shaderDataBufferList[p]._shader.attributeParams){
                        if(this.shaderDataBufferList[p]._shader.attributeParams.hasOwnProperty(_p)){
                            var attrs=this.shaderDataBufferList[p]._shader.attributeParams;
                            if(!this.shaderDataBufferList[p]._buffer[attrs[_p]]){
                                this.shaderDataBufferList[p]._buffer[attrs[_p]]=gl.createBuffer();
                            }

                            gl.bindBuffer(gl.ARRAY_BUFFER,this.shaderDataBufferList[p]._buffer[attrs[_p]]);

                            console.log(this.shaderDataBufferList[p]._data[attrs[_p]]);
                            //change
                            var data=new Float32Array(this.shaderDataBufferList[p]._data[attrs[_p]]);
                            gl.bufferData(gl.ARRAY_BUFFER,data,gl.STATIC_DRAW);

                            var a_attribute=gl.getAttribLocation(this.shaderDataBufferList[p]._shader['_program'],attrs[_p]);

                            var num=BaseShader.supportParamsList[_p].num;
                            var type=gl[BaseShader.supportParamsList[_p].type];

                            length=this.shaderDataBufferList[p]._data[attrs[_p]].length/num;
                            if(oldLen!=0&&length!=oldLen){
                                console.error('shaderDataBufferList:'+p+" _data length error");
                                return;
                            }
                            oldLen=length;

                            console.log(num);
                            gl.vertexAttribPointer(a_attribute,num,gl.FLOAT,false,0,0);//num type
                            gl.enableVertexAttribArray(a_attribute);

                            gl.bindBuffer(gl.ARRAY_BUFFER,null);
                        }
                    }
                    for($p in this.shaderDataBufferList[p]._shader.uniformParams){
                        if(this.shaderDataBufferList[p]._shader.uniformParams.hasOwnProperty($p)){
                            if($p=='mvpMatrix'){
                                var u_MvpMatrix=gl.getUniformLocation(this.shaderDataBufferList[p]._shader['_program'],this.shaderDataBufferList[p]._shader.uniformParams[$p]);
                                var mvpMatrix=this.camera.getMvpMatrix();
                                this.shaderDataBufferList[p]._data[this.shaderDataBufferList[p]._shader.uniformParams[$p]]=mvpMatrix;

                                console.log(mvpMatrix.elements);
                                gl.uniformMatrix4fv(u_MvpMatrix,false,mvpMatrix.elements);
                            }
                        }
                    }

                    console.log(length);
                    gl.drawArrays(gl.TRIANGLES,0,length);
                }
            }
        },
        getElementDomWidth:function(){
            return this.elementDom.width;
        },
        getElementDomHeight:function(){
            return this.elementDom.height;
        },
        set:function(){

        },
        get:function(){

        },
        setClearColorRGBA:function(colorArray){
            this.clearColor=colorArray;
        },
        setSize:function(w,h){
            this.width=w;
            this.height=h;
            this.elementDom.width=w;
            this.elementDom.height=h;
        },
        addOptionalShaderDataBuffer:function(key,shaderDataBuffer){
            this.shaderDataBufferList[key]=shaderDataBuffer;

        },
        getDefaultShaderDataBuffer:function(){
            return this.shaderDataBufferList[0];
        }
    });

    var ShaderDataBuffer=Class.extend({
        init:function(shader,data,buffer){
            this._shader=shader;
            this._data=data||{};
            this._buffer=buffer||{};
        },
        setMark:function(mark){
            this._mark=mark;
        },
        getMark:function(){
            return this._mark;
        }
    });
    /**
     * 着色器
     */
    var BaseShader=Class.extend({
        init:function(attributeParams,uniformParams){
            this.attributeParams=attributeParams;
            this.uniformParams=uniformParams;
        },
        setVertexShaderCode:function(code){
            this.VertexShadercode=code;
        },
        getVertexShaderCode:function(){
            return this.VertexShadercode;
        },
        setFragmentShaderCode:function(code){
            this.FragmentShaderCode=code;
        },
        getFragmentShaderCode:function(){
            return this.FragmentShaderCode;
        }
    });

    BaseShader.supportParamsList={
        position:{
            index:0,
            name:'vertices',
            num:3,
            type:'FLOAT'
        },
        color:{
            index:1,
            name:'mtls',
            default:[0.0,0.0,0.0,0.0],
            num:4,
            type:'FLOAT'
        },
        normal:{
            index:3,
            name:'normals',
            default:[0.0,0.0,0.0],
            num:3,
            type:'FLOAT'
        },
        texture:{
            index:2,
            name:'textures',
            num:3,
            type:'FLOAT'
        },
        mvpMatrix:{
            index:0
        }
    };
    BaseShader.initShaderKey='initShader';
    BaseShader.initTextureShaderKey='initTextureShader';
    BaseShader.initTransparentShaderKey='initTransparentShader';
    BaseShader.initShader=new BaseShader({position:'a_Position',color:'a_Color'},{mvpMatrix:'u_MvpMatrix'});//['a_Position','a_Color']['u_MvpMatrix']
    BaseShader.initShader.setVertexShaderCode(
        'attribute vec4 a_Position;\n'+
        'attribute vec4 a_Color;\n'+
        'uniform mat4 u_MvpMatrix;\n'+
        'varying vec4 v_Color;\n'+
        'void main(){\n'+
        '  gl_Position = u_MvpMatrix * a_Position;\n'+
        '  v_Color = a_Color;\n'+
        '}\n');

    BaseShader.initShader.setFragmentShaderCode(
        'precision mediump float;\n'+
        'varying vec4 v_Color;\n'+
        'void main() {\n'+
        'gl_FragColor = v_Color;\n'+
        '}\n');

    CL3D.BaseMesh = BaseMesh;
    CL3D.BaseScene = BaseScene;
    CL3D.BaseMaterial = BaseMaterial;
    CL3D.BaseRenderer = BaseRenderer;
    CL3D.BaseShader = BaseShader;
    CL3D.BaseCamera = BaseCamera;
}(window));