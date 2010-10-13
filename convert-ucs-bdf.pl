#!/usr/bin/env perl
# usage: convert-ucs-bdf mplus_j10r.bdf  > mplus_j10r-ucs.bdf
use strict;
use warnings;
use Test::Most;
use lib lib => <modules/*/lib>; #/

use Encode;

sub jis2uni ($) {
	my $n = shift;
	my $jis = pack('n', $n);
	my $uni = ord(decode('jis0208-raw', $jis));
}

while (<>) {
	if (/^ENCODING (\d+)$/) {
		my $u = jis2uni($1);
		print "ENCODING $u\n";
	} elsif (/^FONT (.+)$/) {
		my $font = $1;
		$font =~ s/jisx0208.1990-0/iso10646-1/;
		print "FONT $font\n";
	} elsif (/^CHARSET_REGISTRY/) {
		print "CHARSET_REGISTRY iso10646\n"; # UCS
	} elsif (/^CHARSET_ENCODING/) {
		print "CHARSET_ENCODING 1\n";
	} elsif (/^DEFAULT_CHAR (\d+)$/) {
		my $u = jis2uni($1);
		print "DEFAULT_CHAR $u\n";
	} else {
		print $_;
	}
}

