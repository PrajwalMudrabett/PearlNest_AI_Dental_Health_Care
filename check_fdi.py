from pathlib import Path

GT = Path(r"dataset1\test\labels")
PR = Path(r"runs\detect\predict-2\labels")
IOU_THRESHOLD = 0.50

def box(line):
    p=line.split()
    return int(p[0]), *map(float,p[1:5])

def iou(a,b):
    def xyxy(x):
        c,x,y,w,h=x
        return x-w/2,y-h/2,x+w/2,y+h/2
    ax1,ay1,ax2,ay2=xyxy(a); bx1,by1,bx2,by2=xyxy(b)
    ix1,iy1=max(ax1,bx1),max(ay1,by1)
    ix2,iy2=min(ax2,bx2),min(ay2,by2)
    iw,ih=max(0,ix2-ix1),max(0,iy2-iy1)
    inter=iw*ih
    ua=(ax2-ax1)*(ay2-ay1)+(bx2-bx1)*(by2-by1)-inter
    return inter/ua if ua else 0

total=correct=incorrect=missed=false_positive=0

for gf in sorted(GT.glob("*.txt")):
    gt=[box(x) for x in gf.read_text().splitlines() if x.strip()]
    pf=PR/(gf.stem+".txt")
    pred=[box(x) for x in pf.read_text().splitlines() if x.strip()] if pf.exists() else []
    total+=len(gt)
    pairs=[]
    for i,g in enumerate(gt):
        for j,p in enumerate(pred):
            v=iou(g,p)
            if v>=IOU_THRESHOLD:
                pairs.append((v,i,j))
    pairs.sort(reverse=True)
    used_g=set(); used_p=set()
    for v,i,j in pairs:
        if i in used_g or j in used_p: continue
        used_g.add(i); used_p.add(j)
        if gt[i][0]==pred[j][0]:
            correct+=1
        else:
            incorrect+=1
    missed += len(gt)-len(used_g)
    false_positive += len(pred)-len(used_p)

print("\n========== FDI TEST ACCURACY ==========")
print(f"Total ground-truth teeth: {total}")
print(f"Correct FDI predictions:  {correct}")
print(f"Incorrect FDI predictions:{incorrect}")
print(f"Missed teeth:             {missed}")
print(f"Extra false positives:    {false_positive}")
print(f"FDI accuracy:             {100*correct/total:.2f}%")
print("========================================")
