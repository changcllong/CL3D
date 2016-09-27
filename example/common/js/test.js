/**
 * Created by CL on 2016/7/24.
 */


function main(){
    var verticesColors=[
        [0.5,0.5,0.3],[0.5,-1.0,1.0],[-0.4,0.3,-0.2]
    ];

    var mtl=new CL3D.BaseMaterial([0.9,0.5,0.5,1.0]);

    var firMesh=new CL3D.BaseMesh(verticesColors,[[0,0,,],[1,0,,],[2,0,,]],[mtl]);

    var firScene=new CL3D.BaseScene();

    firScene.add(firMesh);

    var firRender=new CL3D.BaseRenderer({});
    firRender.setSize(400,400);

    var firCamera=new CL3D.BaseCamera(30,400/400,1,100);

    firCamera.lookAt([3,3,7],[0,0,0],[0,0,1]);

    var body=document.body;
    body.appendChild(firRender.elementDom);

    firRender.render(firScene,firCamera);


}

window.addEventListener("load",main,true);
