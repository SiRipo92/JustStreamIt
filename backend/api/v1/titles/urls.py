from django.urls import path

from .views import MovieTitleListView, MovieTitleDetailView
from .posters import poster_proxy  # new to prevent console errors and to check image_urls

urlpatterns = [
    path('', MovieTitleListView.as_view(), name="movie-list"),
    path('<int:pk>', MovieTitleDetailView.as_view(), name="movie-detail"),
    path('posters/', poster_proxy, name="poster-proxy"),
]
