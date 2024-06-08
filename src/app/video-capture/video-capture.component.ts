import { CommonModule } from '@angular/common';
import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { NgReduxModule, NgRedux } from '@angular-redux/store';
import * as faceapi from 'face-api.js';

@Component({
  selector: 'app-video-capture',
  standalone: true,
  imports: [
    CommonModule
  ],
  templateUrl: './video-capture.component.html',
  styleUrl: './video-capture.component.css'
})
export class VideoCaptureComponent implements OnInit {

  WIDTH = 440;
  HEIGHT = 280;

  @ViewChild('video', {static: true})
  public video!: ElementRef;

  @ViewChild('canvas', {static: true})
  public canvasRef!: ElementRef;

  @ViewChild('imageUpload', {static: true})
  public imageUpload!: ElementRef;

  @ViewChild('imgCanvas', {static: true})
  public imgCanvas!: ElementRef;

  stream: any;
  detection: any;
  resizedDetections: any;
  canvas: any;
  canvasEl: any;
  imgCanvasEl: any;
  displaySize: any;
  videoInput: any;
  startWebcam = false;
  imgUploaded = false;
  screenWidth: any;
  screenHeight: any;

  constructor(private elRef: ElementRef) {
    
  }

  async startWebcamFeed() {
    await Promise.all([
      faceapi.nets.tinyFaceDetector.loadFromUri('./../../assets/models'),
      faceapi.nets.faceLandmark68Net.loadFromUri('./../../assets/models'),
      faceapi.nets.faceRecognitionNet.loadFromUri('./../../assets/models'),
      faceapi.nets.faceExpressionNet.loadFromUri('./../../assets/models'),
      faceapi.nets.ageGenderNet.loadFromUri('./../../assets/models')
    ]).then(() => this.startVideo());
  }

  async ngOnInit() {
    this.screenWidth = window.innerWidth;  
    this.screenHeight = window.innerHeight; 

    console.log(`screenWidth: ${this.screenWidth}`)
    console.log(`screenHeight: ${this.screenHeight}`)
    if (this.screenWidth <= 400) {
      this.WIDTH = 360;
      this.HEIGHT = 290;
    }
  }

  startVideo() {
    this.startWebcam = true;
    this.videoInput = this.video.nativeElement;
    navigator.mediaDevices.getUserMedia({
      video: {},
      audio: false
    }).then((stream) => {
      this.videoInput.srcObject = stream;
    }).catch((err) => {
      console.error(err);
    })

    this.detectFaces();
  }

  stopVideo() {
    if (this.videoInput.srcObject) {
      const stream = this.videoInput.srcObject;
      const tracks = stream.getTracks();
      tracks.forEach((track: any) => {
        track.stop();
      })
      this.videoInput.srcObject = null;
      while(this.canvasEl.hasChildNodes()) {
        this.canvasEl.removeChild(this.canvasEl.firstChild);
      }
    }
    this.startWebcam = false;
  }

  detectFaces() {
    this.elRef.nativeElement.querySelector('video').addEventListener('play', async () => {
      this.canvas = await faceapi.createCanvasFromMedia(this.videoInput);

      this.canvasEl = this.canvasRef.nativeElement;
      if (this.canvasEl.hasChildNodes()) {
        this.canvasEl.replaceChild(this.canvas, this.canvasEl.childNodes[0]);
      } else {
        this.canvasEl.appendChild(this.canvas);
      }
      this.canvas.setAttribute('id', 'canvas');
      this.displaySize = {
          width: this.videoInput.width,
          height: this.videoInput.height,
      };
      faceapi.matchDimensions(this.canvas, this.displaySize);

      setInterval(async () => {
        this.detection = await faceapi.detectAllFaces(this.videoInput,  new  faceapi.TinyFaceDetectorOptions()).withFaceLandmarks().withFaceExpressions().withAgeAndGender();
        this.resizedDetections = faceapi.resizeResults(
           this.detection,
           this.displaySize
         );
        this.canvas.getContext('2d').clearRect(0, 0, this.canvas.width,this.canvas.height);
        faceapi.draw.drawDetections(this.canvas, this.resizedDetections);
        faceapi.draw.drawFaceLandmarks(this.canvas, this.resizedDetections);
        faceapi.draw.drawFaceExpressions(this.canvas, this.resizedDetections);
        this.resizedDetections.forEach((detection: any) => {
          const box = detection.detection.box
          const drawBox = new faceapi.draw.DrawBox(box, { 
            label: Math.round(detection.age) + " year old " + detection.gender + "; width: " + this.videoInput.width + "px" + " height: " + this.videoInput.height + "px"
          })
          drawBox.draw(this.canvas)
        })
     }, 100);
    })
  }

  uploadImage() {
    Promise.all([
      faceapi.nets.faceRecognitionNet.loadFromUri('./../../assets/models'),
      faceapi.nets.faceLandmark68Net.loadFromUri('./../../assets/models'),
      faceapi.nets.ssdMobilenetv1.loadFromUri('./../../assets/models'),
      faceapi.nets.ageGenderNet.loadFromUri('./../../assets/models')
    ]).then(() => this.startImageFaceRec());
  }

  startImageFaceRec() {
    const container = document.createElement('div')
    container.style.position = 'relative'
    // document.body.append(container)

    this.imgCanvasEl = this.imgCanvas.nativeElement;
      if (this.imgCanvasEl.hasChildNodes()) {
        this.imgCanvasEl.replaceChild(container, this.imgCanvasEl.childNodes[0]);
      } else {
        this.imgCanvasEl.appendChild(container);
      }


    const imageUpload = this.imageUpload.nativeElement;
    // const labeledFaceDescriptors = await loadLabeledImages()
    // const faceMatcher = new faceapi.FaceMatcher(labeledFaceDescriptors, 0.6)
    let image: any = null;
    let imageCanvas: any = null;
    this.imgUploaded = true;
    imageUpload.addEventListener('change', async () => {
      if (image) image.remove();
      if (imageCanvas) imageCanvas.remove();
      image = await faceapi.bufferToImage(imageUpload.files[0]);
      container.append(image);
      imageCanvas = faceapi.createCanvasFromMedia(image);
      container.append(imageCanvas);
      imageCanvas.setAttribute('style', `
        position: absolute;
        top: 0;
        left: 0;
      `);
      const displaySize = { width: image.width, height: image.height }
      faceapi.matchDimensions(imageCanvas, displaySize)
      const detections = await faceapi.detectAllFaces(image).withFaceLandmarks().withFaceDescriptors().withAgeAndGender()
      const resizedDetections = faceapi.resizeResults(detections, displaySize);
      resizedDetections.forEach((detection: any) => {
        const box = detection.detection.box
          const drawBox = new faceapi.draw.DrawBox(box, { 
            label: Math.round(detection.age) + " year old " + detection.gender
          })
          drawBox.draw(imageCanvas)
      })
    })
  }

  deleteImage() {
    while (this.imgCanvasEl.hasChildNodes()) {
      this.imgCanvasEl.removeChild(this.imgCanvasEl.firstChild);
    }
    this.imgUploaded = false;
  }


}
