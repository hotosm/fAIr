# https://services.digitalglobe.com/earthservice/tmsaccess/tms/1.0.0/DigitalGlobe:ImageryTileService@EPSG:3857@jpg/{z}/{x}/{y}.jpg?connectId=c2cbd3f2-003a-46ec-9e46-26a3996d6484&flipy=true
import math

tile_size = 256

def convert2worldcd(lat,lng):
    """
    World coordinates  are measured from the Mercator projection's origin (the northwest corner of the map at 180 degrees longitude and approximately 85 degrees latitude) and increase in the x direction towards the east (right) and increase in the y direction towards the south (down). Because the basic Mercator  tile is 256 x 256 pixels, the usable world coordinate space is {0-256}, {0-256}
    """
    siny = math.sin((lat * math.pi) / 180)
    siny = min(max(siny, -0.9999), 0.9999)
    world_x= tile_size * (0.5 + (lng / 360))
    world_y = tile_size * (0.5 - math.log((1 + siny) / (1 - siny)) / (4 * math.pi))
    print(world_x,world_y)
    return world_x,world_y

def latlng2tile(zoom,lat,lng):  
    """By dividing the pixel coordinates by the tile size and taking the integer parts of the result, you produce as a by-product the tile coordinate at the current zoom level."""
    zoom_byte=1 << zoom #converting zoom level to pixel bytes 
    # print(zoom_byte)
    w_x,w_y=convert2worldcd(lat,lng)
    t_x=math.floor((w_x * zoom_byte) / tile_size)
    t_y=math.floor((w_y * zoom_byte) / tile_size)
    return t_x,t_y

z,x,y=19,-80.6719408929348,35.03247598940751
tile_x,tile_y=latlng2tile(z,x,y)
print(z,tile_x,tile_y)